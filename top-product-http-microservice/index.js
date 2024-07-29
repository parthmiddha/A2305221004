const express = require('express');
const axios = require('axios');
const AUTH_TOKEN = require('./config.js');
const app = express();
const PORT = 9876;

const COMPANIES = ["AMZ", "FLP", "SNP", "MYN", "AZO"];
const API_BASE_URL = "http://20.244.56.144/test";

app.use(express.json());

const fetchProducts = async (company, category, top, minPrice, maxPrice) => {
    const url = `${API_BASE_URL}/companies/${company}/categories/${category}/products`;
    try {
        const response = await axios.get(url, {
            params: {
                top,
                minPrice,
                maxPrice
            },
            headers: {
                Authorization: AUTH_TOKEN
            }
        });
        return response.data;
    } catch (error) {
        console.error(`Error fetching products from ${company}:`, error.message);
        return [];
    }
};

app.get('/categories/:categoryname/products', async (req, res) => {
    const { categoryname } = req.params;
    const { top, minPrice, maxPrice, rating, price, company, discount, order = 'asc' } = req.query;
    const topN = parseInt(top, 10) || 10;

    let allProducts = [];
    const companies = company ? [company] : COMPANIES;

    for (const company of companies) {
        const products = await fetchProducts(company, categoryname, topN, minPrice, maxPrice);
        allProducts = allProducts.concat(products);
    }

    allProducts = allProducts.filter(product => product.availability === 'yes');

    if (rating) {
        allProducts.sort((a, b) => order === 'asc' ? a.rating - b.rating : b.rating - a.rating);
    } else if (price) {
        allProducts.sort((a, b) => order === 'asc' ? a.price - b.price : b.price - a.price);
    } else if (discount) {
        allProducts.sort((a, b) => order === 'asc' ? a.discount - b.discount : b.discount - a.discount);
    }

    res.json(allProducts.slice(0, topN));
});

app.get('/categories/:categoryname/products/:productid', async (req, res) => {
    const { categoryname, productid } = req.params;
    const { company } = req.query;

    if (!company || !COMPANIES.includes(company)) {
        return res.status(400).json({ error: "Invalid or missing company parameter" });
    }

    const products = await fetchProducts(company, categoryname, 1, 0, Number.MAX_SAFE_INTEGER);
    const product = products.find(p => p.id === productid);

    if (!product) {
        return res.status(404).json({ error: "Product not found" });
    }

    res.json(product);
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
