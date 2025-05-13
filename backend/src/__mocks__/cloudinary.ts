const mockUploaderDestroy = jest.fn();
const mockUploaderUpload = jest.fn(); // For potential backend uploads
const mockSearchExecute = jest.fn();

const mockCloudinaryV2 = {
  config: jest.fn(),
  uploader: {
    destroy: mockUploaderDestroy,
    upload: mockUploaderUpload, // For direct backend uploads if ever implemented
    // Add other uploader methods if used (e.g., explicit_update, rename)
  },
  search: {
    expression: jest.fn().mockReturnThis(), // Allows chaining .expression().max_results()...
    max_results: jest.fn().mockReturnThis(),
    sort_by: jest.fn().mockReturnThis(),
    execute: mockSearchExecute,
    // Add other search methods if used
  },
  // Mock other top-level cloudinary methods if needed (e.g., api)
};

// Helper to reset mocks
(mockCloudinaryV2 as any)._resetMocks = () => {
  mockUploaderDestroy.mockReset();
  mockUploaderUpload.mockReset();
  mockSearchExecute.mockReset();
  mockCloudinaryV2.config.mockReset();
  mockCloudinaryV2.search.expression.mockClear();
  mockCloudinaryV2.search.max_results.mockClear();
  mockCloudinaryV2.search.sort_by.mockClear();
};

// Helper to set uploader.destroy response
(mockCloudinaryV2 as any)._setUploaderDestroyResponse = (response: any, error: boolean = false) => {
  if (error) {
    mockUploaderDestroy.mockRejectedValue(response);
  } else {
    mockUploaderDestroy.mockResolvedValue(response);
  }
};

// Helper to set uploader.upload response (for backend uploads)
(mockCloudinaryV2 as any)._setUploaderUploadResponse = (response: any, error: boolean = false) => {
  if (error) {
    mockUploaderUpload.mockRejectedValue(response);
  } else {
    mockUploaderUpload.mockResolvedValue(response);
  }
};

// Helper to set search.execute response
(mockCloudinaryV2 as any)._setSearchExecuteResponse = (response: any, error: boolean = false) => {
  if (error) {
    mockSearchExecute.mockRejectedValue(response);
  } else {
    mockSearchExecute.mockResolvedValue(response);
  }
};

// Default responses
(mockCloudinaryV2 as any)._setDefaultResponses = () => {
  mockUploaderDestroy.mockResolvedValue({ result: 'ok' });
  mockUploaderUpload.mockResolvedValue({
    public_id: 'mock_public_id',
    version: 'mock_version',
    signature: 'mock_signature',
    width: 800,
    height: 600,
    format: 'jpg',
    resource_type: 'image',
    created_at: new Date().toISOString(),
    tags: [],
    bytes: 12345,
    type: 'upload',
    etag: 'mock_etag',
    placeholder: false,
    url: 'http://res.cloudinary.com/mock_cloud/image/upload/v_mock/mock_public_id.jpg',
    secure_url: 'https://res.cloudinary.com/mock_cloud/image/upload/v_mock/mock_public_id.jpg',
    original_filename: 'mock_file',
    asset_id: 'mock_asset_id',
  });
  mockSearchExecute.mockResolvedValue({ resources: [], total_count: 0, next_cursor: undefined });
};

(mockCloudinaryV2 as any)._setDefaultResponses();

// The library is imported as `import cloudinaryV2 from 'cloudinary'; const cloudinary = cloudinaryV2.v2;`
// So we need to export it in a way that Jest can mock this structure.
export const v2 = mockCloudinaryV2;
export default { v2: mockCloudinaryV2 }; // Default export for `import cloudinaryV2 from 'cloudinary'` 