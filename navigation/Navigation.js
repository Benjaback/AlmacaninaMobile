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
import PantallaProveedores from '../screens/ProveedorScreen';
import PantallaEmpleados from '../screens/EmpleadosScreen';

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
        <Stack.Screen name="Proveedores" component={PantallaProveedores} options={{ title: 'Proveedores' }} />
        <Stack.Screen name="Empleados" component={PantallaEmpleados} options={{ title: 'Empleados' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default Navegacion;

