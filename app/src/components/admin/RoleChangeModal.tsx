import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Portal, Dialog, Button, RadioButton, Text } from 'react-native-paper';

interface RoleChangeModalProps {
  visible: boolean;
  currentRole: string;
  onDismiss: () => void;
  onSave: (newRole: string) => void;
}

const RoleChangeModal: React.FC<RoleChangeModalProps> = ({
  visible,
  currentRole,
  onDismiss,
  onSave,
}) => {
  const [selectedRole, setSelectedRole] = useState(currentRole);

  const handleSave = () => {
    onSave(selectedRole);
    onDismiss();
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title style={styles.dialogTitle}>Изменить роль</Dialog.Title>
        <Dialog.Content>
          <RadioButton.Group
            onValueChange={setSelectedRole}
            value={selectedRole}
          >
            <View style={styles.radioItem}>
              <RadioButton.Item
                label="Ученик"
                value="athlete"
                labelStyle={styles.radioLabel}
                color="#E74C3C"
                uncheckedColor="#B0BEC5"
                style={styles.radioButton}
              />
            </View>

            <View style={styles.radioItem}>
              <RadioButton.Item
                label="Професор"
                value="coach"
                labelStyle={styles.radioLabel}
                color="#E74C3C"
                uncheckedColor="#B0BEC5"
                style={styles.radioButton}
              />
            </View>

            <View style={styles.radioItem}>
              <RadioButton.Item
                label="Администратор"
                value="admin"
                labelStyle={styles.radioLabel}
                color="#E74C3C"
                uncheckedColor="#B0BEC5"
                style={styles.radioButton}
              />
            </View>
          </RadioButton.Group>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss} textColor="#B0BEC5">
            Отмена
          </Button>
          <Button onPress={handleSave} textColor="#E74C3C">
            Сохранить
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialog: {
    backgroundColor: '#1B263B',
  },
  dialogTitle: {
    color: '#fff',
  },
  radioItem: {
    marginVertical: 4,
  },
  radioLabel: {
    color: '#fff',
  },
  radioButton: {
    paddingVertical: 4,
  },
});

export default RoleChangeModal;
