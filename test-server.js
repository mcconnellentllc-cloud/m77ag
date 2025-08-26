// Ultra minimal server - no complex routing
const express = require('express');
const app = express();
const PORT = 3000;

// Static file serving only
app.use(express.static('docs'));

// Just one simple test route with no parameters
app.get('/test', (req, res) => {
  res.send('Server is working!');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});