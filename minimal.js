// Ultra minimal server with no routes at all
const express = require('express');
const app = express();
const PORT = 3000;

// Only static file serving
app.use(express.static('docs'));

// Just a basic home route
app.get('/', (req, res) => {
  res.send('Server is working!');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});