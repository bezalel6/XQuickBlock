import React from 'react';
import styled from 'styled-components';
import { ExtensionSettings } from '../../types';

interface ButtonSwitchProps<K extends keyof ExtensionSettings> {
  value: ExtensionSettings[K];
  onChange: (v: ExtensionSettings[K]) => void;
  className: string;
  label?: string;
  disabled?: boolean;
}

const SwitchContainer = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
`;

const SwitchButton = styled.button<{ isOn: boolean }>`
  padding: 8px 16px;
  border-radius: 4px;
  border: 1px solid ${({ isOn }) => (isOn ? '#4CAF50' : '#ccc')};
  background-color: ${({ isOn }) => (isOn ? '#4CAF50' : '#ffffff')};
  color: ${({ isOn }) => (isOn ? '#ffffff' : '#333333')};
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  outline: none;

  &:hover {
    background-color: ${({ isOn }) => (isOn ? '#45a049' : '#f5f5f5')};
    border-color: ${({ isOn }) => (isOn ? '#45a049' : '#bdbdbd')};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background-color: #f5f5f5;
    border-color: #e0e0e0;
    color: #9e9e9e;
  }
`;

const Label = styled.span`
  font-size: 14px;
  color: #333;
`;

export const ButtonSwitch = <K extends keyof ExtensionSettings>({
  value,
  onChange,
  className,
  label,
  disabled = false,
}: ButtonSwitchProps<K>) => {
  const str = () => `${label ? label + ': ' : ''} ${value ? 'Enabled' : 'Disabled'}`;
  return (
    <SwitchContainer className={className}>
      <SwitchButton
        isOn={value as boolean}
        onClick={() => onChange(!value as ExtensionSettings[K])}
        disabled={disabled}
        role="switch"
        aria-checked={value as boolean}
        aria-label={label || 'Toggle button'}
      >
        {str()}
      </SwitchButton>
    </SwitchContainer>
  );
};
