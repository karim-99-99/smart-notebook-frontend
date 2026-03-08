import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {Platform} from 'react-native';
import {ScanScreen} from '../screens/ScanScreen';
import {PreviewScreen} from '../screens/PreviewScreen';
import {EditNoteScreen} from '../screens/EditNoteScreen';
import {ResultScreen} from '../screens/ResultScreen';
import {FoldersScreen} from '../screens/FoldersScreen';
import {HistoryScreen} from '../screens/HistoryScreen';
import {LoginScreen} from '../screens/LoginScreen';
import {colors} from '../theme/colors';
import type {RootStackParamList} from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  const initialRoute = 'Login';

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.primary,
            borderBottomWidth: 3,
            borderBottomColor: colors.teal,
            borderLeftWidth: Platform.OS === 'android' ? 2 : 0,
            borderRightWidth: Platform.OS === 'android' ? 2 : 0,
            borderLeftColor: colors.teal,
            borderRightColor: colors.teal,
          },
          headerTintColor: '#FFF',
          headerTitleStyle: {
            fontWeight: '700',
          },
          headerShadowVisible: true,
        }}>
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Scan"
          component={ScanScreen}
          options={{
            title: 'Smart Notebook',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Preview"
          component={PreviewScreen}
          options={{
            title: 'Preview',
            headerBackTitleVisible: false,
          }}
        />
        <Stack.Screen
          name="EditNote"
          component={EditNoteScreen}
          options={{
            title: 'Edit Note',
            headerBackTitleVisible: false,
            // Allow back button - user can go back to Preview or Scan
          }}
        />
        <Stack.Screen
          name="Result"
          component={ResultScreen}
          options={{
            title: 'Results',
            headerBackTitleVisible: false,
            headerLeft: () => null, // Disable back button
          }}
        />
        <Stack.Screen
          name="Folders"
          component={FoldersScreen}
          options={{
            title: 'Folders',
            headerBackTitleVisible: false,
          }}
        />
        <Stack.Screen
          name="History"
          component={HistoryScreen}
          options={{
            title: 'History',
            headerBackTitleVisible: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
