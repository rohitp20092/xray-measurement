const startIndex = 1;

const padNumber = (num: number, size: number, prefix: string) => {
  return num.toString().padStart(size, prefix);
};

export const imageIds = Array(360)
  .fill(0)
  .map((_, i) => {
    const paddedIndex = padNumber(startIndex + i, 6, "0");
    return `wadouri:https://raw.githubusercontent.com/rohitp20092/example-images/main/image-${paddedIndex}.dcm`;
  });
