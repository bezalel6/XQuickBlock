import { ExtensionSettings } from '../types';

/**
 * Available icon sizes in the extension
 */
export const ICON_SIZES = [16, 32, 48, 128] as const;
export type IconSize = (typeof ICON_SIZES)[number];

/**
 * Gets the path to an icon based on the current theme and optional size
 * @param theme - The current theme ('light' | 'dark')
 * @param size - Optional icon size (16, 32, 48, or 128)
 * @param relativePrefix - Optional prefix to prepend to the icon path
 * @returns The relative path to the icon
 */
export function getIconPath(
  theme: ExtensionSettings['themeOverride'],
  size?: IconSize,
  relativePrefix?: string
): string {
  const themeSuffix = theme === 'dark' ? '-dark' : '-light';
  const sizePrefix = size ? `${size}` : '';
  const prefix = relativePrefix ? `${relativePrefix}/` : '';
  return `${prefix}icons/icon${sizePrefix}${themeSuffix}.png`;
}

/**
 * Gets all icon paths for a given theme
 * @param theme - The current theme ('light' | 'dark')
 * @param relativePrefix - Optional prefix to prepend to the icon paths
 * @returns Record of icon sizes to their paths
 */
export function getAllIconPaths(
  theme: ExtensionSettings['themeOverride'],
  relativePrefix?: string
): Record<IconSize, string> {
  return ICON_SIZES.reduce(
    (acc, size) => {
      acc[size] = getIconPath(theme, size, relativePrefix);
      return acc;
    },
    {} as Record<IconSize, string>
  );
}
