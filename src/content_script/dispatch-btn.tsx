import { Action } from "../types";
import { getSettingsManager } from "../settings-manager";
import { toggleInvisible, sleep, dispatch } from "./utils";

/**
 * Create a styled button with improved hover effects and accessibility
 */
export default function Button(
  icon: string,
  action: Action,
  nameElement: HTMLElement
): HTMLButtonElement {
  const button = document.createElement("button");
  button.innerHTML = icon;
  button.setAttribute("aria-label", `${action} user`);
  button.setAttribute("title", `Click to ${action} user (Ctrl+Click for all)`);

  Object.assign(button.style, {
    marginLeft: "10px",
    padding: "2px 5px",
    borderRadius: "4px",
    border: "none",
    cursor: "pointer",
    backgroundColor: "#1DA1F2",
    color: "white",
    fontSize: "12px",
    transition: "background-color 0.2s",
  });

  const handleHover = (e: MouseEvent) => {
    button.style.backgroundColor = "#0c85d0";
    if (e.ctrlKey) {
      button.innerHTML = `${icon} All In Here`;
    }
  };

  const resetButton = () => {
    button.style.backgroundColor = "#1DA1F2";
    button.innerHTML = icon;
  };

  button.addEventListener("mouseenter", handleHover);
  button.addEventListener("mouseleave", resetButton);
  button.addEventListener("mousemove", handleHover);

  button.addEventListener("click", async (e) => {
    const {
      selectors: { confirmDialogSelector, userNameSelector },
    } = await (await getSettingsManager("content")).getState();
    try {
      toggleInvisible(confirmDialogSelector, true);
      if (e.ctrlKey) {
        const users = Array.from(document.querySelectorAll(userNameSelector))
          .filter(
            (e) => e instanceof HTMLElement && e.style?.display !== "none"
          )
          .sort((a, b) => {
            const rectA = a.getBoundingClientRect();
            const rectB = b.getBoundingClientRect();
            return rectB.y - rectA.y;
          }) as HTMLElement[];

        for (const user of users) {
          user.scrollIntoView({ behavior: "smooth" });
          await sleep(100);
          await dispatch(user, action);
          await sleep(100);
        }
      } else {
        await dispatch(nameElement, action);
      }
    } catch (error) {
      console.error("Error handling button click:", error);
    } finally {
      toggleInvisible(confirmDialogSelector, false);
    }
  });

  return button;
}
