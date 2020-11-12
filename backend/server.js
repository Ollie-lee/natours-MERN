const app = require("../backend/app");

//have everything that is not related to express in one file,
console.log(process.env);
const port = 5000;
app.listen(port, () => {
  console.log(`app running on port ${port}...`);
});
