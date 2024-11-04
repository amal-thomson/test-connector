
// tests/repository/Custom Object/updateCustomObjectWithDescription.test.ts
import { updateCustomObjectWithDescription } from '../../../src/repository/Custom Object/updateCustomObjectWithDescription';

// Mock the entire client module
jest.mock('../../../src/client/create.client', () => ({
  createApiRoot: jest.fn()
}));

// Mock the logger
jest.mock('../../../src/utils/logger.utils', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn()
  }
}));

// Mock the config utils
jest.mock('../../../src/utils/config.utils', () => ({
  readConfiguration: jest.fn().mockReturnValue({
    projectKey: 'test-project',
    clientId: 'test-client',
    clientSecret: 'test-secret',
    scope: 'test-scope',
    apiUrl: 'https://test-api.com'
  })
}));

describe('Update Custom Object Repository', () => {
  const mockProductId = 'test-id';
  const mockDescription = 'Test description';
  const mockImageUrl = 'https://test-image.jpg';
  const mockProductName = 'Test Product';
  
  const mockExecute = jest.fn();
  const mockGet = jest.fn(() => ({ execute: mockExecute }));
  const mockWithContainerAndKey = jest.fn(() => ({ get: mockGet }));
  const mockPost = jest.fn(() => ({ execute: mockExecute }));
  const mockCustomObjects = jest.fn(() => ({
    withContainerAndKey: mockWithContainerAndKey,
    post: mockPost
  }));

  beforeEach(() => {
    const { createApiRoot } = require('../../../src/client/create.client');
    (createApiRoot as jest.Mock).mockReturnValue({
      customObjects: mockCustomObjects
    });
    mockExecute.mockClear();
    mockGet.mockClear();
    mockPost.mockClear();
    mockWithContainerAndKey.mockClear();
    mockCustomObjects.mockClear();
  });

  it('should update custom object successfully', async () => {
    const mockExistingObject = {
      body: {
        version: 1
      }
    };

    const mockUpdatedObject = {
      id: 'custom-object-id',
      version: 2
    };

    // Mock the get request for existing object
    mockExecute.mockResolvedValueOnce(mockExistingObject);
    // Mock the post request for update
    mockExecute.mockResolvedValueOnce(mockUpdatedObject);

    const result = await updateCustomObjectWithDescription(
      mockProductId,
      mockDescription,
      mockImageUrl,
      mockProductName
    );

    expect(result).toEqual(mockUpdatedObject);
    expect(mockCustomObjects).toHaveBeenCalledTimes(2);
    expect(mockWithContainerAndKey).toHaveBeenCalledWith({
      container: "temporaryDescription",
      key: mockProductId
    });
    expect(mockPost).toHaveBeenCalledWith({
      body: {
        container: "temporaryDescription",
        key: mockProductId,
        version: 1,
        value: {
          temporaryDescription: mockDescription,
          imageUrl: mockImageUrl,
          productName: mockProductName,
          generatedAt: expect.any(String)
        }
      }
    });
  });

  it('should handle missing custom object', async () => {
    mockExecute.mockResolvedValueOnce({ body: null });

    await expect(updateCustomObjectWithDescription(
      mockProductId,
      mockDescription,
      mockImageUrl,
      mockProductName
    )).rejects.toThrow(`❌ Custom object not found for product ID: ${mockProductId}`);
  });

  it('should handle get request errors', async () => {
    mockExecute.mockRejectedValueOnce(new Error('Get API Error'));

    await expect(updateCustomObjectWithDescription(
      mockProductId,
      mockDescription,
      mockImageUrl,
      mockProductName
    )).rejects.toThrow('Get API Error');
  });

  it('should handle update request errors', async () => {
    // Mock successful get request
    mockExecute.mockResolvedValueOnce({
      body: {
        version: 1
      }
    });
    // Mock failed update request
    mockExecute.mockRejectedValueOnce(new Error('Update API Error'));

    await expect(updateCustomObjectWithDescription(
      mockProductId,
      mockDescription,
      mockImageUrl,
      mockProductName
    )).rejects.toThrow('Update API Error');
  });
});