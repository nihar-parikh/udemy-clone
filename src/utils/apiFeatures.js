class ApiFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  search() {
    let searchQuery = {};
    const { title, description, category } = this.queryString;

    if (title) {
      searchQuery.title = {
        $regex: title,
        $options: "i", //i means case insensitive
      };
    }

    if (description) {
      searchQuery.description = {
        $regex: description,
        $options: "i",
      };
    }
    if (category) {
      searchQuery.category = {
        $regex: category,
        $options: "i",
      };
    }

    this.query = this.query.find(searchQuery);
    return this;
  }

  // filter() {
  //   const queryCopy = { ...this.queryStr };
  //   //   Removing some fields for category
  //   const removeFields = ["keyword", "page", "limit"];

  //   removeFields.forEach((key) => delete queryCopy[key]);

  //   // Filter For Price and Rating

  //   let queryStr = JSON.stringify(queryCopy);
  //   queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, (key) => `$${key}`);

  //   this.query = this.query.find(JSON.parse(queryStr));

  //   return this;
  // }

  pagination(coursesPerPage) {
    const currentPage = Number(this.queryString.page) || 1; //we need to convert string into number and if there is no page query then by default take it as 1

    const skip = coursesPerPage * (currentPage - 1);
    this.query = this.query.limit(coursesPerPage).skip(skip);
    return this;
  }
}

export default ApiFeatures;
