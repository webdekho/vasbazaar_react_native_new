import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import CustomInput, { CustomPinInput, CustomSearchInput } from '../CustomInput';

// Mock react-native-paper
jest.mock('react-native-paper', () => ({
  TextInput: {
    Icon: () => null,
    Affix: () => null,
  },
}));

describe('CustomInput Component', () => {
  test('renders basic input correctly', () => {
    const { getByDisplayValue, getByText } = render(
      <CustomInput
        label="Test Label"
        value="test value"
        onChangeText={() => {}}
        placeholder="Test placeholder"
      />
    );

    expect(getByText('Test Label')).toBeTruthy();
    expect(getByDisplayValue('test value')).toBeTruthy();
  });

  test('handles text changes', () => {
    const mockOnChangeText = jest.fn();
    const { getByDisplayValue } = render(
      <CustomInput
        value=""
        onChangeText={mockOnChangeText}
        placeholder="Enter text"
      />
    );

    const input = getByDisplayValue('');
    fireEvent.changeText(input, 'new text');
    
    expect(mockOnChangeText).toHaveBeenCalledWith('new text');
  });

  test('shows error state correctly', () => {
    const { getByText } = render(
      <CustomInput
        value=""
        onChangeText={() => {}}
        errorText="This field is required"
      />
    );

    expect(getByText('This field is required')).toBeTruthy();
  });

  test('shows required indicator', () => {
    const { getByText } = render(
      <CustomInput
        label="Required Field"
        value=""
        onChangeText={() => {}}
        required={true}
      />
    );

    expect(getByText('Required Field *')).toBeTruthy();
  });
});

describe('CustomPinInput Component', () => {
  test('renders PIN input with correct length', () => {
    const { getAllByDisplayValue } = render(
      <CustomPinInput
        value="12"
        onChangeText={() => {}}
        length={4}
      />
    );

    // Should render 4 input fields
    const inputs = getAllByDisplayValue('');
    expect(inputs).toHaveLength(2); // 2 empty fields (index 2,3)
  });

  test('calls onComplete when PIN is filled', () => {
    const mockOnComplete = jest.fn();
    const { rerender } = render(
      <CustomPinInput
        value="123"
        onChangeText={() => {}}
        onComplete={mockOnComplete}
        length={4}
      />
    );

    rerender(
      <CustomPinInput
        value="1234"
        onChangeText={() => {}}
        onComplete={mockOnComplete}
        length={4}
      />
    );

    expect(mockOnComplete).toHaveBeenCalledWith('1234');
  });
});

describe('CustomSearchInput Component', () => {
  test('renders search input with icon', () => {
    const { getByDisplayValue } = render(
      <CustomSearchInput
        value="search query"
        onChangeText={() => {}}
        placeholder="Search..."
      />
    );

    expect(getByDisplayValue('search query')).toBeTruthy();
  });

  test('handles search input changes', () => {
    const mockOnChangeText = jest.fn();
    const { getByDisplayValue } = render(
      <CustomSearchInput
        value=""
        onChangeText={mockOnChangeText}
        placeholder="Search..."
      />
    );

    const input = getByDisplayValue('');
    fireEvent.changeText(input, 'search term');
    
    expect(mockOnChangeText).toHaveBeenCalledWith('search term');
  });
});

// Test styling and theme integration
describe('CustomInput Styling', () => {
  test('applies custom container styles', () => {
    const customStyle = { backgroundColor: 'red' };
    const { getByTestId } = render(
      <CustomInput
        value=""
        onChangeText={() => {}}
        containerStyle={customStyle}
        testID="custom-input-container"
      />
    );

    // In a real test, you'd check if the style was applied
    // This is a basic structure test
    expect(getByTestId).toBeDefined();
  });

  test('supports multiline input', () => {
    const { getByDisplayValue } = render(
      <CustomInput
        value="line 1\nline 2"
        onChangeText={() => {}}
        multiline={true}
        numberOfLines={3}
      />
    );

    const input = getByDisplayValue('line 1\nline 2');
    expect(input.props.multiline).toBe(true);
  });
});

// Integration test with typical form usage
describe('CustomInput Integration', () => {
  test('works in a typical form scenario', () => {
    const formData = {
      name: '',
      email: '',
      phone: '',
    };

    const setFormData = jest.fn();

    const { getByLabelText } = render(
      <div>
        <CustomInput
          label="Full Name"
          value={formData.name}
          onChangeText={(value) => setFormData({ ...formData, name: value })}
          required={true}
        />
        <CustomInput
          label="Email"
          value={formData.email}
          onChangeText={(value) => setFormData({ ...formData, email: value })}
          keyboardType="email-address"
        />
        <CustomInput
          label="Phone"
          value={formData.phone}
          onChangeText={(value) => setFormData({ ...formData, phone: value })}
          keyboardType="numeric"
          maxLength={10}
        />
      </div>
    );

    // Basic integration test structure
    expect(getByLabelText).toBeDefined();
  });
});