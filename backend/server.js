const dotenv = require('dotenv');
//save environment variable in the process
//so it can accessed in any file
dotenv.config({ path: './config.env' });

const app = require('./app');

//have everything that is not related to express in one file,
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`app running on port ${port}...`);
});
