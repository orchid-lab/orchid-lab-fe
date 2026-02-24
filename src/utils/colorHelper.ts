interface RGBColor {
  r: number;
  g: number;
  b: number;
}

export interface ColorInfo {
  name: string;
  r: number;
  g: number;
  b: number;
}

export const colorPalette: ColorInfo[] = [
  { name: "Đỏ tươi", r: 255, g: 0, b: 0 },
  { name: "Cam tươi", r: 255, g: 165, b: 0 },
  { name: "Vàng tươi", r: 255, g: 255, b: 0 },
  { name: "Xanh lá cây", r: 0, g: 128, b: 0 },
  { name: "Xanh dương", r: 0, g: 0, b: 255 },
  { name: "Chàm", r: 75, g: 0, b: 130 },
  { name: "Tím", r: 128, g: 0, b: 128 },
  { name: "Hồng", r: 255, g: 192, b: 203 },
  { name: "Trắng", r: 255, g: 255, b: 255 },
  { name: "Đen", r: 0, g: 0, b: 0 },
  { name: "Xám", r: 128, g: 128, b: 128 },
  { name: "Nâu", r: 165, g: 42, b: 42 },
  { name: "Đỏ đẫm", r: 139, g: 0, b: 0 },
  { name: "Cà chua", r: 255, g: 99, b: 71 },
  { name: "Cam nhật", r: 255, g: 140, b: 0 },
  { name: "Vàng nhạt", r: 255, g: 250, b: 205 },
  { name: "Xanh lá nhạt", r: 144, g: 238, b: 144 },
  { name: "Xanh dương nhạt", r: 173, g: 216, b: 230 },
  { name: "Tím nhạt", r: 216, g: 191, b: 216 },
];

function calculateColorDistance(color1: RGBColor, color2: RGBColor): number {
  const rDiff = color1.r - color2.r;
  const gDiff = color1.g - color2.g;
  const bDiff = color1.b - color2.b;
  return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
}

export function findClosestColorName(r: number, g: number, b: number): string {
  const inputColor: RGBColor = { r, g, b };
  let closestColor = colorPalette[0];
  let minDistance = calculateColorDistance(inputColor, closestColor);

  for (let i = 1; i < colorPalette.length; i++) {
    const distance = calculateColorDistance(inputColor, colorPalette[i]);
    if (distance < minDistance) {
      minDistance = distance;
      closestColor = colorPalette[i];
    }
  }

  return closestColor.name;
}

export function rgbToColorString(r: number, g: number, b: number): string {
  return `rgb(${r}, ${g}, ${b})`;
}

export function isRGBTraitGroup(traits: any[]): {
  [key: string]: { r?: number; g?: number; b?: number };
} {
  const rgbGroups: { [key: string]: { r?: number; g?: number; b?: number } } =
    {};

  traits.forEach((trait) => {
    const match = trait.name.match(/(.*?)\s*-\s*(Red|Green|Blue|r|g|b)$/i);
    if (match) {
      const baseName = match[1].trim().toLowerCase();
      const component = match[2].toLowerCase();
      const mappedComponent = component === "r" ? "r" : component === "g" ? "g" : "b";

      if (!rgbGroups[baseName]) {
        rgbGroups[baseName] = {};
      }
      rgbGroups[baseName][mappedComponent as "r" | "g" | "b"] = trait.value;
    }
  });

  return rgbGroups;
}

export function getRGBTraitsAndHasColor(traits: any[]): {
  colorTraits: { [key: string]: string };
  nonColorTraits: any[];
} {
  const rgbGroups = isRGBTraitGroup(traits);
  const colorTraits: { [key: string]: string } = {};
  const processedIndices = new Set<number>();

  Object.entries(rgbGroups).forEach(([baseName, components]) => {
    if (
      components.r !== undefined &&
      components.g !== undefined &&
      components.b !== undefined
    ) {
      const colorName = findClosestColorName(
        components.r,
        components.g,
        components.b
      );
      const rgbString = rgbToColorString(
        components.r,
        components.g,
        components.b
      );
      colorTraits[baseName] = `${colorName} (${rgbString})`;

      traits.forEach((trait, index) => {
        const match = trait.name.match(/(.*?)\s*-\s*(Red|Green|Blue|r|g|b)$/i);
        if (match && match[1].trim().toLowerCase() === baseName) {
          processedIndices.add(index);
        }
      });
    }
  });

  const nonColorTraits = traits.filter((_, index) => !processedIndices.has(index));

  return { colorTraits, nonColorTraits };
}
