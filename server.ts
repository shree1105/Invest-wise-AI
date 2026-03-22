import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import * as ss from "simple-statistics";
import yahooFinance from 'yahoo-finance2';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_API_KEY;

  // Simple Linear Regression (Multiple)
  const coefficients = [0.00002, 0.05, 0.08, 0.00001, 0.1]; // income, age, risk, amount, tenure
  const intercept = 2.5;

  function predictReturn(features: number[]) {
    return features.reduce((acc, val, i) => acc + val * coefficients[i], intercept);
  }

  // API Endpoints
  app.post("/api/predict", (req, res) => {
    try {
      const { income, age, risk_score, investment_amount, tenure } = req.body;
      if (!income || !age || !risk_score || !investment_amount || !tenure) {
        return res.status(400).json({ error: "Missing required features" });
      }
      const prediction = predictReturn([income, age, risk_score, investment_amount, tenure]);
      res.json({ predicted_return: parseFloat(prediction.toFixed(2)) });
    } catch (error) {
      res.status(500).json({ error: "Prediction failed" });
    }
  });

  app.get("/api/stock-prices", async (req, res) => {
    try {
      const symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA'];
      const results = await Promise.all(
        symbols.map(async (symbol) => {
          try {
            const quote: any = await yahooFinance.quote(symbol);
            return {
              symbol: quote.symbol,
              name: quote.shortName || quote.longName || symbol,
              price: quote.regularMarketPrice,
              change: quote.regularMarketChangePercent,
            };
          } catch (e) {
            // Fallback for individual symbol failure
            return {
              symbol,
              name: symbol,
              price: 150 + Math.random() * 100,
              change: (Math.random() - 0.5) * 2,
            };
          }
        })
      );
      res.json(results);
    } catch (error) {
      // Global fallback
      res.json([
        { symbol: "AAPL", name: "Apple Inc.", price: 185.92, change: 1.2 },
        { symbol: "GOOGL", name: "Alphabet Inc.", price: 142.71, change: -0.5 },
      ]);
    }
  });

  app.get("/api/market-insights", async (req, res) => {
    if (!ALPHA_VANTAGE_KEY) {
      return res.json({
        insights: "Market is currently stable. Diversification is recommended for long-term growth. (Add Alpha Vantage API Key for real-time insights)",
        sentiment: "Neutral"
      });
    }

    try {
      const response = await axios.get(`https://www.alphavantage.co/query?function=MARKET_STATUS&apikey=${ALPHA_VANTAGE_KEY}`);
      res.json(response.data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch market insights" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
