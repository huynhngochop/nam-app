import { useWindowDimensions } from 'react-native';

/**
 * Cỡ cửa sổ theo chiều rộng (dp), cập nhật ngay khi gập/mở máy gập, xoay máy, chia đôi màn hình.
 * compact < 600 (điện thoại, máy gập khi gập) · medium 600–839 (máy gập mở dọc, tablet nhỏ dọc)
 * expanded ≥ 840 (tablet ngang, máy gập mở ngang).
 */
export type WindowClass = 'compact' | 'medium' | 'expanded';

export function windowClassOf(width: number): WindowClass {
  if (width >= 840) return 'expanded';
  if (width >= 600) return 'medium';
  return 'compact';
}

export function useLayout() {
  const { width, height, fontScale } = useWindowDimensions();
  const cls = windowClassOf(width);
  return {
    width,
    height,
    fontScale,
    cls,
    isCompact: cls === 'compact',
    /** Danh sách + chi tiết cạnh nhau. */
    twoPane: cls === 'expanded',
    /** Thanh điều hướng dọc bên trái thay cho tab dưới. */
    rail: cls === 'expanded',
    landscape: width > height,
    /** Chiều rộng tối đa cho cột nội dung đọc (không kéo dãn chữ trên tablet). */
    readableWidth: cls === 'compact' ? width : 720,
    /** Số cột cho lưới thẻ. */
    columns: (min: number = 1) => Math.max(min, cls === 'compact' ? min : cls === 'medium' ? min + 1 : min + 2),
    gutter: cls === 'compact' ? 16 : 24,
  };
}
