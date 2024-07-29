const express = require('express');
const axios = require('axios');
const { AUTH_TOKEN } = require('./config.js');
const app = express();
const PORT = 9876;
const WINDOW_SIZE = 10;

let windowNumbers = [];

const TEST_SERVER_URLS = {
    'p': 'http://20.244.56.144/test/primes',
    'f': 'http://20.244.56.144/test/fibo',
    'e': 'http://20.244.56.144/test/even',
    'r': 'http://20.244.56.144/test/rand'
};

const fetchNumbers = async (numberId) => {
    const url = TEST_SERVER_URLS[numberId];
    if (!url) return [];

    try {
        const response = await axios.get(url, {
            headers: { Authorization: AUTH_TOKEN },
            timeout: 500
        });
        console.log("Request sent to:", url);
        console.log("Response received:", response.data);
        return response.data.numbers || [];
    } catch (error) {
        console.error("Error fetching numbers:", error.message);
        return [];
    }
};

const updateWindow = (newNumbers) => {
    const windowPrevState = [...windowNumbers];
    const currentNumbers = new Set(windowNumbers);

    newNumbers.forEach(number => {
        if (!currentNumbers.has(number)) {
            if (windowNumbers.length >= WINDOW_SIZE) {
                windowNumbers.shift();
            }
            windowNumbers.push(number);
        }
    });

    return { windowPrevState, windowCurrState: [...windowNumbers] };
};

app.get('/numbers/:numberid', async (req, res) => {
    const numberId = req.params.numberid;
    const numbers = await fetchNumbers(numberId);
    if (numbers.length === 0) {
        console.warn("No numbers received from test server.");
    }
    const { windowPrevState, windowCurrState } = updateWindow(numbers);
    const avg = windowCurrState.reduce((acc, num) => acc + num, 0) / windowCurrState.length || 0;

    res.json({
        numbers,
        windowPrevState,
        windowCurrState,
        avg: avg.toFixed(2)
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
