import { Request, Response, NextFunction } from 'express';
import { Model, Document } from 'mongoose';

// Extend Express Response to include advancedResults
declare global {
  namespace Express {
    interface Response {
      advancedResults?: {
        success: boolean;
        count: number;
        pagination: any; // Consider defining a more specific pagination type
        data: any[]; // Consider using T[] if model type T is known
      };
    }
  }
}

interface QueryParams {
  select?: string;
  sort?: string;
  page?: string;
  limit?: string;
  [key: string]: any; // For other filter fields
}

const advancedResults = <T extends Document>(
  model: Model<T>,
  populate?: string | object | Array<string | object> // Mongoose populate options
) => async (req: Request<{}, {}, {}, QueryParams>, res: Response, next: NextFunction) => {
  let query;

  // Copy req.query
  const reqQuery = { ...req.query };

  // Fields to exclude
  const removeFields: string[] = ['select', 'sort', 'page', 'limit'];

  // Loop over removeFields and delete them from reqQuery
  removeFields.forEach(param => delete reqQuery[param]);

  // Create query string
  let queryStr = JSON.stringify(reqQuery);

  // Create operators ($gt, $gte, etc)
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

  // Finding resource
  // The type for query will be inferred by Mongoose methods
  query = model.find(JSON.parse(queryStr));

  // Select Fields
  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
  }

  // Sort
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt'); // Default sort
  }

  // Pagination
  const page = parseInt(req.query.page || '1', 10);
  const limit = parseInt(req.query.limit || '25', 10);
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  // Count documents based on the filtered query string, not the full query object that includes sort/select
  const total = await model.countDocuments(JSON.parse(queryStr)); 

  query = query.skip(startIndex).limit(limit);

  // Populate
  if (populate) {
    query = query.populate(populate);
  }

  // Executing query
  const results = await query;

  // Pagination result
  const pagination: any = {}; // Define a more specific type if possible

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit
    };
  }

  res.advancedResults = {
    success: true,
    count: results.length,
    pagination,
    data: results
  };

  next();
};

export default advancedResults; 