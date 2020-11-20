class APIFeatures {
  constructor(query, queryString) {
    //from mongoose
    this.query = query;
    //from express
    this.queryString = queryString;
  }

  filter() {
    // 1) filtering
    //shallow copy queryString for filtering
    const queryObj = { ...this.queryString };
    //these elements will not be used for query
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    //remove the above fields in the query obj
    excludedFields.forEach((element) => delete queryObj[element]);

    // 2) advanced filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    //build query
    this.query = this.query.find(JSON.parse(queryStr));

    //return this instantiated object
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      //split in to an array using comma as a separator than join by space to a new string
      const sortBy = this.queryString.sort.split(',').join(' ');
      //cuz it's a query obj, it has a bunch of built-in methods
      //default is ascending
      this.query = this.query.sort(sortBy);
    } else {
      // if no sorting field is specified, the latest createdAt document will come up first
      this.query = this.query.sort('-createdAt');
    }

    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      //if user not specifying fields, remove some field such as "__v"
      //add prefix "-", so it will not send __v to client
      this.query = this.query.select('-__v');
    }

    return this;
  }

  pagination() {
    const page = this.queryString.page * 1 || 1; //convert string to number
    const limit = this.queryString.limit * 1 || 100;
    //e.g. page1: 0-10 page2: 11-20 page3: 21-30
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

module.exports = APIFeatures;
