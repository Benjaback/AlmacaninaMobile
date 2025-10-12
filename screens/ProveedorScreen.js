import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

export default function ProveedorScreen({ navigation }) {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Proveedores</Text>
            <Text style={styles.subtitle}>Aquí puedes gestionar a los proveedores</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
});