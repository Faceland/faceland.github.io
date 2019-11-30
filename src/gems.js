import MinecraftTextJS from "minecraft-text-js";

import { chatColorize } from "./chatColors";
import gems from "./gems.yml";

function searchFilter() {
  const input = document.getElementById("search-text");
  const filter = input.value.toUpperCase();
  const table = document.getElementById("gem-table");
  const tr = table.getElementsByTagName("tr");

  for (let i = 0; i < tr.length; i++) {
    let td = tr[i].getElementsByTagName("td")[0];
    if (td) {
      const txtValue = td.textContent || td.innerText;
      if (txtValue.toUpperCase().indexOf(filter) > -1) {
        tr[i].style.display = "";
      } else {
        tr[i].style.display = "none";
      }
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const gemTable = document.getElementById("gem-table");

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
