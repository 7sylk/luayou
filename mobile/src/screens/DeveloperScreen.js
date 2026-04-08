import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, Text, TextInput, View } from "react-native";
import Screen from "../components/Screen";
import SectionCard from "../components/SectionCard";
import PrimaryButton from "../components/PrimaryButton";
import { Body, Eyebrow, Title } from "../components/Type";
import { colors, spacing } from "../theme";
import { developerAPI, formatApiError } from "../lib/api";

function calculateLevelFromXp(xp) {
  if (xp <= 0) return 1;
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

function Field({ label, value, onChangeText, keyboardType = "default" }) {
  return (
    <View style={{ flex: 1, minWidth: "45%" }}>
      <Text style={{ color: colors.faint, fontSize: 11, letterSpacing: 1.1, textTransform: "uppercase", marginBottom: spacing.xs }}>
        {label}
      </Text>
      <TextInput
        value={String(value)}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize="none"
        style={{
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.background,
          color: colors.text,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm
        }}
      />
    </View>
  );
}

function UserEditor({ user, onSave, onDelete }) {
  const [form, setForm] = useState({
    username: user.username || "",
    xp: user.xp ?? 0,
    level: user.level ?? 1,
    streak: user.streak ?? 0,
    lessons_completed: user.lessons_completed ?? 0,
    daily_completed: user.daily_completed ?? 0,
    perfect_quizzes: user.perfect_quizzes ?? 0
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const setTextField = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const setNumberField = (key, value) => {
    const parsed = Number(value);
    const nextValue = Number.isFinite(parsed) ? parsed : 0;
    setForm((current) => {
      if (key === "xp") {
        return { ...current, xp: nextValue, level: calculateLevelFromXp(nextValue) };
      }
      return { ...current, [key]: nextValue };
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      await onSave(user.id, form);
      Alert.alert("Saved", `Updated ${user.username}`);
    } catch (error) {
      Alert.alert("Error", formatApiError(error));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    Alert.alert("Delete user", `Delete ${user.email}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setDeleting(true);
          try {
            await onDelete(user.id);
          } catch (error) {
            Alert.alert("Error", formatApiError(error));
          } finally {
            setDeleting(false);
          }
        }
      }
    ]);
  };

  return (
    <SectionCard>
      <View style={{ gap: spacing.md }}>
        <View>
          <Text style={{ color: colors.text, fontWeight: "600" }}>{user.email}</Text>
          <Text style={{ color: colors.faint, marginTop: 4 }}>{user.id}</Text>
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
          <Field label="Username" value={form.username} onChangeText={(value) => setTextField("username", value)} />
          <Field label="XP" value={form.xp} onChangeText={(value) => setNumberField("xp", value)} keyboardType="numeric" />
          <Field label="Level" value={form.level} onChangeText={(value) => setNumberField("level", value)} keyboardType="numeric" />
          <Field label="Streak" value={form.streak} onChangeText={(value) => setNumberField("streak", value)} keyboardType="numeric" />
          <Field label="Lessons" value={form.lessons_completed} onChangeText={(value) => setNumberField("lessons_completed", value)} keyboardType="numeric" />
          <Field label="Daily" value={form.daily_completed} onChangeText={(value) => setNumberField("daily_completed", value)} keyboardType="numeric" />
          <Field label="Perfect quizzes" value={form.perfect_quizzes} onChangeText={(value) => setNumberField("perfect_quizzes", value)} keyboardType="numeric" />
        </View>

        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <PrimaryButton label={saving ? "Saving" : "Save"} onPress={save} disabled={saving} style={{ flex: 1 }} />
          <PrimaryButton label={deleting ? "Deleting" : "Delete"} onPress={remove} subtle disabled={deleting} style={{ flex: 1 }} />
        </View>
      </View>
    </SectionCard>
  );
}

export default function DeveloperScreen() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [checkRes, usersRes] = await Promise.all([developerAPI.check(), developerAPI.listUsers()]);
      setIsAdmin(Boolean(checkRes.data?.is_admin));
      setUsers(usersRes.data || []);
    } catch {
      setIsAdmin(false);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) => {
      return [user.email, user.username, user.id].some((value) => String(value || "").toLowerCase().includes(query));
    });
  }, [search, users]);

  const handleSave = async (id, form) => {
    const response = await developerAPI.updateUser(id, form);
    setUsers((current) => current.map((user) => (user.id === id ? response.data : user)));
  };

  const handleDelete = async (id) => {
    await developerAPI.deleteUser(id);
    setUsers((current) => current.filter((user) => user.id !== id));
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
        <View>
          <Eyebrow>Admin</Eyebrow>
          <Title style={{ marginTop: spacing.sm }}>Developer panel</Title>
        </View>

        {loading ? (
          <SectionCard>
            <Body>Loading admin tools...</Body>
          </SectionCard>
        ) : !isAdmin ? (
          <SectionCard>
            <Body>You do not have access to this page.</Body>
          </SectionCard>
        ) : (
          <>
            <SectionCard>
              <Text style={{ color: colors.text, fontWeight: "600" }}>Search users</Text>
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search by email, username, or user ID"
                placeholderTextColor={colors.faint}
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                  color: colors.text,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.md,
                  marginTop: spacing.md
                }}
              />
              <Text style={{ color: colors.faint, marginTop: spacing.sm }}>
                {filteredUsers.length} of {users.length} users
              </Text>
            </SectionCard>

            {filteredUsers.map((user) => (
              <UserEditor key={user.id} user={user} onSave={handleSave} onDelete={handleDelete} />
            ))}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
