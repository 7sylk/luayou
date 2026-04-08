import { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import Screen from "../components/Screen";
import SectionCard from "../components/SectionCard";
import PrimaryButton from "../components/PrimaryButton";
import { Body, Eyebrow, Title } from "../components/Type";
import { colors, spacing } from "../theme";
import { useAuth } from "../context/AuthContext";
import { authAPI, formatApiError } from "../lib/api";

export default function AuthScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showVerifyEntry, setShowVerifyEntry] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (error) {
      const detail = formatApiError(error);
      if (
        error?.response?.status === 403 &&
        typeof detail === "string" &&
        detail.toLowerCase().includes("email not verified")
      ) {
        setShowVerifyEntry(true);
        setMode("verify");
      }
      Alert.alert("Error", detail);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async () => {
    setSubmitting(true);
    try {
      const res = await register(email, password, username);
      Alert.alert("Account created", res.data?.message || "Check your email for a verification code.");
      setShowVerifyEntry(true);
      setMode("verify");
    } catch (error) {
      Alert.alert("Error", formatApiError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async () => {
    setSubmitting(true);
    try {
      const res = await authAPI.verifyEmail({ email, code: verificationCode });
      Alert.alert("Verified", res.data?.message || "Email verified. You can sign in now.");
      setVerificationCode("");
      setShowVerifyEntry(false);
      setMode("login");
    } catch (error) {
      Alert.alert("Error", formatApiError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setSubmitting(true);
    try {
      const res = await authAPI.resendVerification({ email });
      Alert.alert("Verification code sent", res.data?.message || "Verification code sent if email exists.");
    } catch (error) {
      Alert.alert("Error", formatApiError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgot = async () => {
    setSubmitting(true);
    try {
      const res = await authAPI.forgotPassword({ email });
      Alert.alert("Reset code sent", res.data?.message || "Reset code sent if email exists.");
      setMode("reset");
    } catch (error) {
      Alert.alert("Error", formatApiError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async () => {
    setSubmitting(true);
    try {
      const res = await authAPI.resetPassword({ token: resetToken, password: newPassword });
      Alert.alert("Password reset", res.data?.message || "Password reset. Please sign in.");
      setPassword("");
      setResetToken("");
      setNewPassword("");
      setMode("login");
    } catch (error) {
      Alert.alert("Error", formatApiError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const submit = async () => {
    if (mode === "login") return handleLogin();
    if (mode === "register") return handleRegister();
    if (mode === "verify") return handleVerify();
    if (mode === "forgot") return handleForgot();
    return handleReset();
  };

  return (
    <Screen style={{ padding: spacing.xl, justifyContent: "center" }}>
      <Eyebrow>LuaYou</Eyebrow>
      <Title style={{ marginTop: spacing.sm }}>
        {mode === "login" && "Learn Lua daily."}
        {mode === "register" && "Create your account."}
        {mode === "verify" && "Verify your email."}
        {mode === "forgot" && "Recover your account."}
        {mode === "reset" && "Choose a new password."}
      </Title>
      <Body style={{ marginTop: spacing.sm, marginBottom: spacing.xl }}>
        Practice lessons, track your progress, and keep everything in sync with your account.
      </Body>

      <SectionCard>
        {mode === "register" ? (
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="Username"
            placeholderTextColor={colors.faint}
            autoCapitalize="none"
            style={inputStyle}
          />
        ) : null}

        {mode !== "reset" ? (
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={colors.faint}
            autoCapitalize="none"
            style={inputStyle}
          />
        ) : null}

        {mode === "verify" ? (
          <TextInput
            value={verificationCode}
            onChangeText={setVerificationCode}
            placeholder="Verification code"
            placeholderTextColor={colors.faint}
            autoCapitalize="none"
            style={inputStyle}
          />
        ) : null}

        {mode === "reset" ? (
          <>
            <TextInput
              value={resetToken}
              onChangeText={setResetToken}
              placeholder="Reset code"
              placeholderTextColor={colors.faint}
              autoCapitalize="none"
              style={inputStyle}
            />
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="New password"
              placeholderTextColor={colors.faint}
              secureTextEntry
              style={inputStyle}
            />
          </>
        ) : mode !== "forgot" ? (
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={colors.faint}
            secureTextEntry
            style={inputStyle}
          />
        ) : null}

        <PrimaryButton
          label={
            submitting
              ? "Please wait"
              : mode === "login"
                ? "Log in"
                : mode === "register"
                  ? "Create account"
                  : mode === "verify"
                    ? "Verify email"
                    : mode === "forgot"
                      ? "Send reset code"
                      : "Reset password"
          }
          onPress={submit}
          disabled={submitting}
          style={{ marginTop: spacing.md }}
        />

        {mode === "verify" ? (
          <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
            <Pressable onPress={handleResend}>
              <Text style={linkStyle}>Resend verification code</Text>
            </Pressable>
            <Pressable onPress={() => setMode("login")}>
              <Text style={linkStyle}>Back to sign in</Text>
            </Pressable>
          </View>
        ) : mode === "forgot" ? (
          <Pressable onPress={() => setMode("login")} style={{ marginTop: spacing.md }}>
            <Text style={linkStyle}>Back to sign in</Text>
          </Pressable>
        ) : mode === "reset" ? (
          <Pressable onPress={() => setMode("login")} style={{ marginTop: spacing.md }}>
            <Text style={linkStyle}>Back to sign in</Text>
          </Pressable>
        ) : (
          <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
            <Pressable onPress={() => setMode(mode === "login" ? "register" : "login")}>
              <Text style={linkStyle}>
                {mode === "login" ? "Need an account? Sign up" : "Already have an account? Log in"}
              </Text>
            </Pressable>
            {mode === "login" ? (
              <>
                <Pressable onPress={() => setMode("forgot")}>
                  <Text style={linkStyle}>Forgot password?</Text>
                </Pressable>
                {showVerifyEntry ? (
                  <Pressable onPress={() => setMode("verify")}>
                    <Text style={linkStyle}>Enter verification code</Text>
                  </Pressable>
                ) : null}
              </>
            ) : null}
          </View>
        )}
      </SectionCard>
    </Screen>
  );
}

const inputStyle = {
  borderWidth: 1,
  borderColor: colors.border,
  backgroundColor: colors.background,
  color: colors.text,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.md,
  marginBottom: spacing.md
};

const linkStyle = {
  color: colors.muted,
  textAlign: "center"
};
