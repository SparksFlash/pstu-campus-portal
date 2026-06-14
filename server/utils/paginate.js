/**
 * Paginate a Mongoose query.
 * @param {Model} Model - Mongoose model
 * @param {Object} filter - Query filter object
 * @param {Object} options - { page, limit, sort, populate }
 * @returns {{ data, pagination }}
 */
exports.paginateQuery = async (Model, filter = {}, options = {}) => {
  const page  = Math.max(1, parseInt(options.page, 10)  || 1);
  const limit = Math.min(100, parseInt(options.limit, 10) || 20);
  const skip  = (page - 1) * limit;
  const sort  = options.sort || { createdAt: -1 };

  let query = Model.find(filter).sort(sort).skip(skip).limit(limit);
  if (options.populate) query = query.populate(options.populate);
  if (options.select)   query = query.select(options.select);

  const [data, total] = await Promise.all([query, Model.countDocuments(filter)]);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
};
