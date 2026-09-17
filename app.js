const tabs = document.querySelectorAll(".tab");
const screens = document.querySelectorAll(".screen");

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const targetScreen = tab.dataset.screen;

    // タブの状態を変更
    tabs.forEach((item) => {
      item.classList.remove("active");
    });

    tab.classList.add("active");


    // 画面を変更
    screens.forEach((screen) => {
      screen.classList.remove("active");
    });

    document
      .getElementById(targetScreen)
      .classList.add("active");
  });
});
