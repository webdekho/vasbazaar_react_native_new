import React, { useContext, useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Searchbar, Text } from 'react-native-paper';
import PropTypes from 'prop-types';

import CommonHeader2 from '../../../components/CommoHedder2';
import { AuthContext } from '../../../context/AuthContext';
import { getRecords } from '../../../Services/ApiServices';

/**
 * BillerList component for displaying available billers for a service
 * 
 * Features:
 * - Search functionality to filter billers
 * - Loading states and error handling
 * - Navigation to PayBill screen with selected biller
 * - Responsive grid layout for biller items
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Object} props.route - Route object containing service parameters
 * @param {Object} props.navigation - Navigation object for screen transitions
 * @returns {JSX.Element} The BillerList component
 */
export default function BillerList({ route, navigation }) {
    const authContext = useContext(AuthContext);
    const { userToken } = authContext;
    
    const serviceId = route.params?.serviceId || 'NA';
    const serviceName = route.params?.serviceName || 'NA';

    const [searchQuery, setSearchQuery] = useState('');
    const [operatorList, setOperatorList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    
    const getOperatorList = async (serviceId) => {
        setIsLoading(true);
        try {
            const response = await getRecords({ serviceId }, userToken, 'api/customer/operator/getByServiceId');
            if (response?.status === 'success') {
                setOperatorList(response.data);
            }
        } catch (error) {
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        getOperatorList(serviceId);
    }, [serviceId]);

    const filteredBillers = operatorList.filter((biller) =>
        biller.operatorName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <>
            <CommonHeader2
                heading={serviceName}
                showLogo={true}
                bharat_connect="bharat_connect"
                whiteHeader={true}
                whiteText={false}
            />

            <ScrollView 
                style={styles.container}
                contentContainerStyle={styles.contentContainer}
            >
                <Searchbar
                    placeholder="Search billers"
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchBar}
                    iconColor="#666"
                    inputStyle={styles.searchInput}
                    elevation={1}
                />

                {isLoading ? (
                    <ActivityIndicator 
                        animating={true} 
                        size="large" 
                        style={styles.loader} 
                    />
                ) : (
                    <View style={styles.section}>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            Available Billers
                        </Text>
                        
                        {filteredBillers.length > 0 ? (
                            filteredBillers.map((biller, index) => (
                                <Pressable
                                    key={index}
                                    style={styles.billerItem}
                                    onPress={() => navigation.navigate('PayBill', { 
                                        biller, 
                                        serviceId 
                                    })}
                                    android_ripple={{ color: '#f0f0f0' }}
                                >
                                    <Image 
                                        source={{ uri: biller.logo }} 
                                        style={styles.logo} 
                                        defaultSource={require('../../../../assets/icons/default.png')}
                                    />
                                    <Text variant="bodyLarge" style={styles.billerText}>
                                        {biller.operatorName}
                                    </Text>
                                </Pressable>
                            ))
                        ) : (
                            <Text 
                                variant="bodyMedium" 
                                style={styles.emptyText}
                            >
                                {searchQuery ? 
                                    'No matching billers found' : 
                                    'No billers available'
                                }
                            </Text>
                        )}
                    </View>
                )}
            </ScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    contentContainer: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 24,
    },
    searchBar: {
        marginBottom: 16,
        backgroundColor: '#fff',
        borderRadius: 8,
    },
    searchInput: {
        fontSize: 14,
        minHeight: 36,
    },
    section: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 16,
    },
    sectionTitle: {
        fontWeight: '600',
        marginBottom: 12,
        color: '#333',
    },
    loader: {
        marginVertical: 24,
    },
    logo: {
        width: 40,
        height: 40,
        resizeMode: 'contain',
        marginRight: 12,
        borderRadius: 4,
    },
    billerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    billerText: {
        flex: 1,
        color: '#333',
    },
    emptyText: {
        textAlign: 'center',
        paddingVertical: 16,
        color: '#999',
    },
});

BillerList.propTypes = {
    route: PropTypes.object.isRequired,
    navigation: PropTypes.object.isRequired,
};