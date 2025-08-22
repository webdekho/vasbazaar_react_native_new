import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import CrashReportingService from '../Services/CrashReportingService';

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree and displays a fallback UI
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to crash reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Report to crash reporting with additional context
    CrashReportingService.logError(error, `Component Stack: ${errorInfo.componentStack}`);
    
    // You can also log additional context
    CrashReportingService.logEvent('error_boundary_triggered', {
      error_message: error.message,
      component_stack: errorInfo.componentStack.substring(0, 500), // Limit length
      screen: this.props.screenName || 'unknown'
    });
  }

  handleRetry = () => {
    // Clear error state to retry rendering
    this.setState({ hasError: false, error: null });
    
    // Log retry attempt
    CrashReportingService.logEvent('error_boundary_retry', {
      screen: this.props.screenName || 'unknown'
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      return (
        <View style={styles.container}>
          <View style={styles.errorContainer}>
            <Ionicons name="warning-outline" size={60} color="#FF6B6B" />
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.message}>
              We're sorry, but something unexpected happened. The error has been reported and we'll fix it soon.
            </Text>
            
            {__DEV__ && (
              <View style={styles.debugContainer}>
                <Text style={styles.debugTitle}>Debug Info:</Text>
                <Text style={styles.debugText}>{this.state.error?.message}</Text>
              </View>
            )}
            
            <TouchableOpacity style={styles.retryButton} onPress={this.handleRetry}>
              <Ionicons name="refresh" size={20} color="#FFFFFF" />
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
            
            {this.props.onError && (
              <TouchableOpacity 
                style={styles.homeButton} 
                onPress={() => this.props.onError(this.state.error)}
              >
                <Ionicons name="home" size={20} color="#666666" />
                <Text style={styles.homeText}>Go to Home</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    alignItems: 'center',
    maxWidth: 300,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  debugContainer: {
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    width: '100%',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 5,
  },
  debugText: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'monospace',
  },
  retryButton: {
    backgroundColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CCCCCC',
  },
  homeText: {
    color: '#666666',
    fontSize: 16,
    marginLeft: 8,
  },
});

// PropTypes for better type checking
ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  screenName: PropTypes.string,
  onError: PropTypes.func,
};

ErrorBoundary.defaultProps = {
  screenName: 'unknown',
  onError: null,
};

export default ErrorBoundary;