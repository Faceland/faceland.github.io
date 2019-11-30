import MinecraftTextJS from "minecraft-text-js";

import { chatColorize } from "./chatColors";
import gems from "./gems.yml";

function searchFilter() {
  const input = document.getElementById("search-text");
  const filter = input.value.toUpperCase();
  const table = document.getElementById("gem-table");
  const tbody = table.getElementsByTagName("tbody")[0];
  const tr = tbody.getElementsByTagName("tr");

  for (let i = 0; i < tr.length; i++) {
    let name = tr[i].getElementsByTagName("td")[0];
    let itemGroups = tr[i].getElementsByTagName("td")[1];
    let effects = tr[i].getElementsByTagName("td")[2];
    let show = false;
    if (name) {
      const txtValue = name.textContent || name.innerText;
      show = show || txtValue.toUpperCase().indexOf(filter) > -1;
    }
    if (itemGroups) {
      const txtValue = itemGroups.textContent || itemGroups.innerText;
      show = show || txtValue.toUpperCase().indexOf(filter) > -1;
    }
    if (effects) {
      const txtValue = effects.textContent || effects.innerText;
      show = show || txtValue.toUpperCase().indexOf(filter) > -1;
    }

    tr[i].style.display = show ? "" : "none";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const gemTable = document.getElementById("gem-table").getElementsByTagName("tbody")[0];

  const gemKeys = Object.keys(gems).filter(gem => gem !== "version");
  gemKeys.forEach(gem => {
    const gemRow = gemTable.insertRow(-1);

    const nameCell = gemRow.insertCell(0);
    nameCell.appendChild(document.createTextNode(gem));

    const itemGroupsCell = gemRow.insertCell(1);
    itemGroupsCell.appendChild(
      document.createTextNode(gems[gem]["item-groups"].join(" "))
    );

    const effectsCell = gemRow.insertCell(2);
    effectsCell.setAttribute(
      "style",
      "white-space:pre-wrap; word-wrap:break-word"
    );
    effectsCell.setAttribute("class", "gem-lore");
    effectsCell.innerHTML = MinecraftTextJS.toHTML(
      gems[gem]["lore"].map(lineOfLore => chatColorize(lineOfLore)).join("\n")
    );
  });

  document.getElementById("search-text").onkeyup = searchFilter;
});
