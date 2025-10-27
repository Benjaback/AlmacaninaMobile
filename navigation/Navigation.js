import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { onAuthStateChanged } from 'firebase/auth';  
import { auth } from '../src/config/firebaseConfig';  
import Login from '../screens/Login';
import SignUp from '../screens/SignUp';
import Cambiar from '../screens/Cambiar';
import HomeWithTabs from '../screens/Home';
import PantallaProductos from '../screens/ProductScreen';
import PantallaPerfil from '../screens/PerfilScreen';
import EditarPerfilScreen from '../screens/EditarPerfilScreen';
import PantallaProveedores from '../screens/ProveedorScreen';
import PantallaEmpleados from '../screens/EmpleadosScreen';
import CreateProductScreen from '../screens/CreateProductScreen';
import EditarProductoScreen from '../screens/EditarProductScreen';
import ProductScreen from '../screens/ProductScreen';


const Stack = createStackNavigator();

function Navegacion() {
  const [estaAutenticado, setEstaAutenticado] = useState(false);

  useEffect(() => {
    const desuscribir = onAuthStateChanged(auth, usuario => {
      if (usuario) {
        setEstaAutenticado(true); 
      } else {
        setEstaAutenticado(false); 
      }
    });

    return () => desuscribir();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={estaAutenticado ? "Inicio" : "Login"}>
        <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
        <Stack.Screen name="SignUp" component={SignUp} options={{ headerShown: false }} />
        <Stack.Screen name="Cambiar" component={Cambiar} options={{ headerShown: false }} />
        <Stack.Screen name="Inicio" component={HomeWithTabs} options={{ headerShown: false }} />
        <Stack.Screen name="GestionarProductos" component={PantallaProductos} options={{ title: 'Gestionar Productos' }} />
        <Stack.Screen name="Perfil" component={PantallaPerfil} options={{ title: 'Perfil' }} />
        <Stack.Screen name="EditarPerfil" component={EditarPerfilScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Proveedores" component={PantallaProveedores} options={{ title: 'Proveedores' }} />
        <Stack.Screen name="Empleados" component={PantallaEmpleados} options={{ title: 'Empleados' }} />
        <Stack.Screen name="CrearProducto" component={CreateProductScreen} options={{ title: 'Crear Producto' }} />
        <Stack.Screen name="EditarProducto"  component={EditarProductoScreen} options={{ title: 'Editar Producto' }}/>
        <Stack.Screen name="ProductScreen" component={ProductScreen} options={{ title: 'Producto'}} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default Navegacion;

