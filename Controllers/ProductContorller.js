import axios from "axios";
import Product from "../Models/DataSchema.js";

export const fetchAndSeedData = async () => {
  try {
    // Check if any product already exists in the database
    const existingProducts = await Product.find({});

    if (existingProducts.length > 0) {
      console.log("Database is already seeded. Skipping seeding process.");
      return;
    }

    const response = await axios.get(
      "https://s3.amazonaws.com/roxiler.com/product_transaction.json"
    );
    const data = response.data;

    const products = data.map((item) => ({
      id: item.id,
      title: item.title,
      price: item.price,
      description: item.description,
      category: item.category,
      image: item.image,
      sold: item.sold,
      dateOfSale: new Date(item.dateOfSale).toISOString().slice(0, 10),
    }));

    await Product.insertMany(products);
    console.log("Database seeded with product data.");
  } catch (error) {
    // Handle duplicate insertion error
    if (error.code === 11000) {
      console.error("Duplicate record found, skipping the insertion.");
    } else {
      console.error("Error during seeding process:", error);
    }
  }
};

export const getProductsForSelectedMonth = async (req, res) => {
  try {
    const { page = 1, perPage = 10, search = "", month } = req.query;

    const limit = parseInt(perPage, 10);
    const skip = (parseInt(page, 10) - 1) * limit;

    const pipeline = [];

    let monthInt;

    if (month) {
      monthInt = parseInt(month, 10);

      pipeline.push({
        $match: {
          $expr: {
            $eq: [{ $month: "$dateOfSale" }, monthInt],
          },
        },
      });
    }

    // Filter by search text in title, description, or price
    if (search) {
      const searchRegex = new RegExp(search, "i"); 

      
      const priceSearch = parseFloat(search);
      const isPriceSearch = !isNaN(priceSearch);

      pipeline.push({
        $match: {
          $or: [
            { title: searchRegex },
            { description: searchRegex },
            ...(isPriceSearch
              ? [
                  {
                    price: {
                      $gte: priceSearch,
                      $lt: priceSearch + 1,
                    },
                  },
                ]
              : []),
          ],
        },
      });
    }

  
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    const products = await Product.aggregate(pipeline);

  
    let total = 0;
    if (monthInt) {
      total = await Product.countDocuments({
        $expr: {
          $eq: [{ $month: "$dateOfSale" }, monthInt],
        },
      });
    } else {
      total = await Product.countDocuments();
    }

    res.status(200).json({
      total,
      page: parseInt(page, 10),
      perPage: limit,
      products,
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ error: "Server error while fetching transactions" });
  }
};

export const getSalesForSelectedMonth = async (req, res) => {
  try {
    const { month } = req.query;

    if (!month) {
      return res.status(400).json({ error: "Month is required" });
    }

    const monthInt = parseInt(month, 10);

    const stats = await Product.aggregate([
      {
        $match: {
          $expr: {
            $eq: [{ $month: "$dateOfSale" }, monthInt],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalSaleAmount: {
            $sum: { $cond: [{ $eq: ["$sold", true] }, "$price", 0] },
          },
          totalSoldItems: {
            $sum: { $cond: [{ $eq: ["$sold", true] }, 1, 0] },
          },
          totalNotSoldItems: {
            $sum: { $cond: [{ $eq: ["$sold", false] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalSaleAmount: 1,
          totalSoldItems: 1,
          totalNotSoldItems: 1,
        },
      },
    ]);

    res.status(200).json(
      stats[0] || {
        totalSaleAmount: 0,
        totalSoldItems: 0,
        totalNotSoldItems: 0,
      }
    );
  } catch (error) {
    console.error("Error fetching sales statistics:", error);
    res
      .status(500)
      .json({ error: "Server error while fetching sales statistics" });
  }
};

export const barChartDataForSelectedMonth = async (req, res) => {
  try {
    const { month } = req.query;

    if (!month) {
      return res.status(400).json({ error: "Month is required" });
    }

    const monthInt = parseInt(month, 10);

    const priceRanges = await Product.aggregate([
      {
        $match: {
          $expr: {
            $eq: [{ $month: "$dateOfSale" }, monthInt],
          },
        },
      },
      {
        $bucket: {
          groupBy: "$price",
          boundaries: [0, 101, 201, 301, 401, 501, 601, 701, 801, 901],
          default: "901+",
          output: {
            count: { $sum: 1 },
          },
        },
      },
    ]);

    res.status(200).json(priceRanges);
  } catch (error) {
    console.error("Error fetching price range data:", error);
    res
      .status(500)
      .json({ error: "Server error while fetching price range data" });
  }
};

export const getCategoryDataForSelectedMonth = async (req, res) => {
  try {
    const { month } = req.query;

    if (!month) {
      return res.status(400).json({ error: "Month is required" });
    }

    const monthInt = parseInt(month, 10);

    const categoryData = await Product.aggregate([
      {
        $match: {
          $expr: {
            $eq: [{ $month: "$dateOfSale" }, monthInt],
          },
        },
      },
      {
        $group: {
          _id: "$category",
          itemCount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          itemCount: 1,
        },
      },
    ]);

    res.status(200).json(categoryData);
  } catch (error) {
    console.error("Error fetching category data:", error);
    res
      .status(500)
      .json({ error: "Server error while fetching category data" });
  }
};
