const getValidImage = (images = []) => {
  return images.find((url) =>
    typeof url === "string" &&
    /\.(jpg|jpeg|png|webp)(\?|$)/i.test(url)
  );
};
export default getValidImage;