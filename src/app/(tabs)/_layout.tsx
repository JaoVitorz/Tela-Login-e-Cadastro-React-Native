import { Tabs } from "expo-router";
import { SessionGuard } from "@/components/SessionGuard";
import React, { useEffect, useState } from "react";
import { Image, StyleSheet } from "react-native";
import { CalendarDays, House, PawPrint, UserRound } from "lucide-react-native";
import { colors } from "@/theme/colors";
import { profileApi } from "@/services/profileApi";
import { authApi } from "@/services/api";
import {
  getStoredProfilePhoto,
  persistProfilePhoto,
  setProfilePhoto,
  useProfilePhoto,
} from "@/services/profilePhotoStore";

function ProfileTabIcon({
  color,
  size,
  focused,
}: {
  color: string;
  size: number;
  focused: boolean;
}) {
  const photo = useProfilePhoto();
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [photo]);
  if (photo && !failed) {
    return (
      <Image
        key={photo}
        source={{ uri: photo }}
        onError={() => setFailed(true)}
        style={[
          styles.profileTabPhoto,
          {
            width: size + 2,
            height: size + 2,
            borderRadius: (size + 2) / 2,
            borderColor: focused ? colors.action : "transparent",
          },
        ]}
      />
    );
  }
  return <UserRound color={color} size={size} />;
}

export default function TabsLayout() {
  return <SessionGuard><AuthenticatedTabsLayout /></SessionGuard>;
}

function AuthenticatedTabsLayout() {
  useEffect(() => {
    let active = true;
    async function hydrateProfilePhoto() {
      try {
        const { user } = await authApi.getProfile();
        const userId = user.id || user._id || "";
        const storedPhoto = await getStoredProfilePhoto(userId);
        if (active && storedPhoto) setProfilePhoto(storedPhoto);
        const profile = await profileApi.getMyProfile();
        if (profile?.foto_perfil) {
          await persistProfilePhoto(userId, profile.foto_perfil);
          if (active) setProfilePhoto(profile.foto_perfil);
        }
      } catch {
        // A foto persistida permanece como fallback quando o serviço estiver indisponível.
      }
    }
    void hydrateProfilePhoto();
    return () => {
      active = false;
    };
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.brandPanel },
        headerTintColor: colors.white,
        tabBarActiveTintColor: colors.action,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { height: 62, paddingTop: 5 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Início",
          tabBarIcon: ({ color, size }) => <House color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="adocoes"
        options={{
          title: "Adoções",
          tabBarIcon: ({ color, size }) => (
            <PawPrint color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen name="eventos" options={{ href: null }} />
      <Tabs.Screen name="eventos-mobile" options={{ href: null }} />
      <Tabs.Screen
        name="eventos-integrados"
        options={{
          title: "Eventos",
          tabBarIcon: ({ color, size }) => (
            <CalendarDays color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen name="perfil" options={{ href: null }} />
      <Tabs.Screen
        name="perfil-profissional"
        options={{
          title: "Perfil",
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <ProfileTabIcon color={color} size={size} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  profileTabPhoto: { borderWidth: 2, backgroundColor: "#e5f7ea" },
});
