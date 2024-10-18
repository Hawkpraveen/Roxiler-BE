import express from "express";
import {
  barChartDataForSelectedMonth,
  getCategoryDataForSelectedMonth,
  getProductsForSelectedMonth,
  getSalesForSelectedMonth,
} from "../Controllers/ProductContorller.js";

const router = express.Router();

router.get("/transactions", getProductsForSelectedMonth);
router.get("/sales", getSalesForSelectedMonth);
router.get("/bar-chart", barChartDataForSelectedMonth);
router.get('/category', getCategoryDataForSelectedMonth);

export default router;
