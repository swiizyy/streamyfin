import { useAtom } from "jotai";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";
import { TVPasswordEntryModal } from "@/components/login/TVPasswordEntryModal";
import { TVPINEntryModal } from "@/components/login/TVPINEntryModal";
import { useTVUserSwitchModal } from "@/hooks/useTVUserSwitchModal";
import { apiAtom, useJellyfin, userAtom } from "@/providers/JellyfinProvider";
import {
  getPreviousServers,
  type SavedServer,
  type SavedServerAccount,
} from "@/utils/secureCredentials";
import { TVSectionHeader } from "./TVSectionHeader";
import { TVSettingsOptionButton } from "./TVSettingsOptionButton";

export const TVUserSwitchSection: React.FC = () => {
  const { t } = useTranslation();
  const [user] = useAtom(userAtom);
  const [api] = useAtom(apiAtom);
  const { loginWithSavedCredential, loginWithPassword } = useJellyfin();
  const { showUserSwitchModal } = useTVUserSwitchModal();

  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [selectedServer, setSelectedServer] = useState<SavedServer | null>(
    null,
  );
  const [selectedAccount, setSelectedAccount] =
    useState<SavedServerAccount | null>(null);

  const isAnyModalOpen = pinModalVisible || passwordModalVisible;

  const currentServer = useMemo(() => {
    if (!api?.basePath) return null;
    const servers = getPreviousServers();
    return servers.find((s) => s.address === api.basePath) || null;
  }, [api?.basePath]);

  const otherAccounts = useMemo(() => {
    if (!currentServer || !user?.Id) return [];
    return currentServer.accounts.filter(
      (account) => account.userId !== user.Id,
    );
  }, [currentServer, user?.Id]);

  const hasOtherAccounts = otherAccounts.length > 0;

  const handleAccountSelect = async (account: SavedServerAccount) => {
    if (!currentServer) return;

    if (account.securityType === "none") {
      try {
        await loginWithSavedCredential(currentServer.address, account.userId);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : t("server.session_expired");
        const isSessionExpired = errorMessage.includes(
          t("server.session_expired"),
        );
        Alert.alert(
          isSessionExpired
            ? t("server.session_expired")
            : t("login.connection_failed"),
          isSessionExpired ? t("server.please_login_again") : errorMessage,
        );
      }
    } else if (account.securityType === "pin") {
      setSelectedServer(currentServer);
      setSelectedAccount(account);
      setPinModalVisible(true);
    } else if (account.securityType === "password") {
      setSelectedServer(currentServer);
      setSelectedAccount(account);
      setPasswordModalVisible(true);
    }
  };

  const handlePinSuccess = async () => {
    setPinModalVisible(false);
    if (selectedServer && selectedAccount) {
      try {
        await loginWithSavedCredential(
          selectedServer.address,
          selectedAccount.userId,
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : t("server.session_expired");
        const isSessionExpired = errorMessage.includes(
          t("server.session_expired"),
        );
        Alert.alert(
          isSessionExpired
            ? t("server.session_expired")
            : t("login.connection_failed"),
          isSessionExpired ? t("server.please_login_again") : errorMessage,
        );
      }
    }
    setSelectedServer(null);
    setSelectedAccount(null);
  };

  const handlePasswordSubmit = async (password: string) => {
    if (selectedServer && selectedAccount) {
      await loginWithPassword(
        selectedServer.address,
        selectedAccount.username,
        password,
      );
    }
    setPasswordModalVisible(false);
    setSelectedServer(null);
    setSelectedAccount(null);
  };

  const handleSwitchUser = () => {
    if (!currentServer || !user?.Id) return;
    showUserSwitchModal(currentServer, user.Id, {
      onAccountSelect: handleAccountSelect,
    });
  };

  return (
    <>
      <TVSectionHeader title={t("home.settings.switch_user.account")} />
      <TVSettingsOptionButton
        label={t("home.settings.switch_user.switch_user")}
        value={user?.Name || "-"}
        onPress={handleSwitchUser}
        disabled={!hasOtherAccounts || isAnyModalOpen}
        isFirst
      />

      <TVPINEntryModal
        visible={pinModalVisible}
        onClose={() => {
          setPinModalVisible(false);
          setSelectedAccount(null);
          setSelectedServer(null);
        }}
        onSuccess={handlePinSuccess}
        onForgotPIN={() => {
          setPinModalVisible(false);
          setSelectedAccount(null);
          setSelectedServer(null);
        }}
        serverUrl={selectedServer?.address || ""}
        userId={selectedAccount?.userId || ""}
        username={selectedAccount?.username || ""}
      />

      <TVPasswordEntryModal
        visible={passwordModalVisible}
        onClose={() => {
          setPasswordModalVisible(false);
          setSelectedAccount(null);
          setSelectedServer(null);
        }}
        onSubmit={handlePasswordSubmit}
        username={selectedAccount?.username || ""}
      />
    </>
  );
};
