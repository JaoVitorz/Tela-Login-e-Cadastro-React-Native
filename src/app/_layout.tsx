import { Stack } from 'expo-router';
import React from 'react';

export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="event-new" />
      <Stack.Screen name="event-details" />
      <Stack.Screen name="seguranca" />
      <Stack.Screen name="faq" />
      <Stack.Screen name="politicas" />
      <Stack.Screen name="privacidade" />
    </Stack>
  );
}
