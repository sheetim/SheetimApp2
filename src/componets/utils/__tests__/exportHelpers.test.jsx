import { exportToCSV } from '../exportHelpers';

// Mock the download functionality
global.URL.createObjectURL = jest.fn();
global.URL.revokeObjectURL = jest.fn();

describe('Export Helpers', () => {
  let originalCreateElement;
  let mockLink;

  beforeEach(() => {
    // Mock document.createElement for <a> element
    originalCreateElement = document.createElement;
    mockLink = {
      href: '',
      download: '',
      click: jest.fn(),
      style: {}
    };
    
    document.createElement = jest.fn((tagName) => {
      if (tagName === 'a') {
        return mockLink;
      }
      return originalCreateElement.call(document, tagName);
    });

    document.body.appendChild = jest.fn();
    document.body.removeChild = jest.fn();
  });

  afterEach(() => {
    document.createElement = originalCreateElement;
    jest.clearAllMocks();
  });

  describe('exportToCSV', () => {
    test('should create CSV with correct headers', () => {
      const data = [
        { name: 'Test', amount: 100 }
      ];
      const headers = { name: 'Name', amount: 'Amount' };
      const filename = 'test.csv';

      exportToCSV(data, headers, filename);

      expect(mockLink.download).toBe(filename);
      expect(mockLink.click).toHaveBeenCalled();
    });

    test('should handle empty data array', () => {
      const data = [];
      const headers = { name: 'Name', amount: 'Amount' };
      const filename = 'test.csv';

      exportToCSV(data, headers, filename);

      expect(mockLink.click).toHaveBeenCalled();
    });

    test('should escape commas in CSV values', () => {
      const data = [
        { name: 'Test, Inc', amount: 100 }
      ];
      const headers = { name: 'Name', amount: 'Amount' };
      const filename = 'test.csv';

      exportToCSV(data, headers, filename);

      // The CSV should wrap values with commas in quotes
      expect(mockLink.click).toHaveBeenCalled();
    });

    test('should handle Hebrew characters', () => {
      const data = [
        { name: 'בדיקה', amount: 100 }
      ];
      const headers = { name: 'שם', amount: 'סכום' };
      const filename = 'test.csv';

      exportToCSV(data, headers, filename);

      expect(mockLink.click).toHaveBeenCalled();
    });

    test('should handle missing values', () => {
      const data = [
        { name: 'Test' }
      ];
      const headers = { name: 'Name', amount: 'Amount' };
      const filename = 'test.csv';

      exportToCSV(data, headers, filename);

      expect(mockLink.click).toHaveBeenCalled();
    });

    test('should handle numeric values correctly', () => {
      const data = [
        { name: 'Test', amount: 1234.56 }
      ];
      const headers = { name: 'Name', amount: 'Amount' };
      const filename = 'test.csv';

      exportToCSV(data, headers, filename);

      expect(mockLink.click).toHaveBeenCalled();
    });
  });
});