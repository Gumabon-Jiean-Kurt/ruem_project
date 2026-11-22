(function (global) {
  const looks = {
    'shirt-classic': { color: '#67db80', accent: '#eaffd8', mark: 'star' },
    'shirt-berry': { color: '#de648f', accent: '#ffd7e5', mark: 'heart' },
    'shirt-sailor': { color: '#68a9da', accent: '#f4f3ff', mark: 'anchor' },
    'shirt-sunshine': { color: '#f4bd38', accent: '#fff3a6', mark: 'sun' },
    'shirt-flower': { color: '#65bd74', accent: '#ffefae', mark: 'flower' },
    'shirt-star': { color: '#6154a6', accent: '#ffe581', mark: 'moon' },
    'hair-bow': { color: '#ff6b9f' },
    'hair-sun': { color: '#ffbd31' },
    'hair-cloud': { color: '#fff5ee' },
    'hair-crown': { color: '#ffd43b' },
    'hair-star': { color: '#ffd43b' },
    'shoes-sneakers': { color: '#54c4e8' },
    'shoes-rainboots': { color: '#62bd80' },
    'shoes-slippers': { color: '#ed8bb0' },
    'shoes-skates': { color: '#ab7ded' },
    'shoes-sandals': { color: '#f1a94d' },
    'pants-overalls': { color: '#4d91c8', accent: '#ffd43b' },
    'pants-shorts': { color: '#f2a448', accent: '#fff0bd' },
    'pants-tutu': { color: '#e879ad', accent: '#ffd9eb' },
    'pants-joggers': { color: '#8994b8', accent: '#e6ecff' },
    'pants-rainbow': { color: '#a66de0', accent: '#ffd43b' },
    'accessory-bandana': { color: '#ec526a' },
    'accessory-glasses': { color: '#7241a5' },
    'accessory-backpack': { color: '#d97c39' },
    'accessory-bell': { color: '#ffd43b' },
    'accessory-cape': { color: '#e74562' },
    'accessory-flower': { color: '#ff77ad' },
    'accessory-scarf': { color: '#7357c7' },
    'accessory-wand': { color: '#ab70ed' }
  };

  const shirtShape = 'M76 151 Q82 141 98 139 L106 151 L114 139 Q130 141 145 151 L151 179 Q111 188 69 179 Z';
  const pantsShape = 'M72 172 Q110 181 148 172 L147 194 Q134 201 115 195 L110 201 L105 195 Q86 201 73 194 Z';

  function shirtMark(look) {
    const color = look.accent;
    if (look.mark === 'heart') return `<path d="M110 159 C105 153 98 157 101 162 L110 169 L119 162 C122 157 115 153 110 159Z" fill="${color}"/>`;
    if (look.mark === 'anchor') return `<path d="M110 153V164M104 158H116M106 164Q110 170 114 164M103 162L106 164L104 167M117 162L114 164L116 167" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
    if (look.mark === 'sun') return `<circle cx="110" cy="160" r="4" fill="${color}"/><path d="M110 152V150M110 170V168M102 160H100M120 160H118M104 154L102.5 152.5M117.5 167.5L116 166M116 154L117.5 152.5M104 166L102.5 167.5" stroke="${color}" stroke-width="2" stroke-linecap="round"/>`;
    if (look.mark === 'flower') return `<circle cx="110" cy="160" r="3" fill="${color}"/><circle cx="110" cy="155" r="2.5" fill="#fff0b0"/><circle cx="115" cy="160" r="2.5" fill="#fff0b0"/><circle cx="110" cy="165" r="2.5" fill="#fff0b0"/><circle cx="105" cy="160" r="2.5" fill="#fff0b0"/>`;
    if (look.mark === 'moon') return `<path d="M114 154A7 7 0 1 0 118 166A6 6 0 0 1 114 154Z" fill="${color}"/><circle cx="103" cy="160" r="1.5" fill="${color}"/>`;
    return `<path d="M110 153L112 158L117 158L113 161L115 166L110 163L105 166L107 161L103 158L108 158Z" fill="${color}"/>`;
  }

  function renderShirt(id) {
    const look = looks[id];
    if (!look) return '';
    return `<g><path d="${shirtShape}" fill="${look.color}" stroke="#342642" stroke-width="2" stroke-linejoin="round"/><path d="M82 149L76 174M138 149L145 174" stroke="${look.accent}" stroke-width="2" opacity=".55"/>${shirtMark(look)}</g>`;
  }

  function renderPants(id) {
    const look = looks[id];
    if (!look) return '';
    const detail = id === 'pants-overalls'
      ? `<path d="M101 177L103 195M119 177L117 195M103 179L117 179" fill="none" stroke="${look.accent}" stroke-width="2"/>`
      : id === 'pants-rainbow'
        ? `<path d="M76 180L145 180M75 185L145 185M76 190L143 190" fill="none" stroke="${look.accent}" stroke-width="2"/>`
        : `<path d="M110 181V193" stroke="${look.accent}" stroke-width="2" opacity=".72"/>`;
    return `<g><path d="${pantsShape}" fill="${look.color}" stroke="#342642" stroke-width="2" stroke-linejoin="round"/>${detail}</g>`;
  }

  function renderHair(id) {
    const look = looks[id];
    if (!look) return '';
    if (id === 'hair-bow') return `<g fill="${look.color}" stroke="#532743" stroke-width="1.5"><path d="M70 76Q60 64 66 59Q74 60 78 71Q84 61 91 62Q96 70 82 79Z"/><circle cx="77" cy="74" r="4" fill="#ffd7e5"/></g>`;
    if (id === 'hair-sun') return `<g><circle cx="151" cy="72" r="8" fill="${look.color}" stroke="#6b3b38" stroke-width="1.5"/><circle cx="151" cy="72" r="3.5" fill="#fff0a7"/><path d="M151 60V56M151 88V84M139 72H135M167 72H163M143 64L140 61M162 83L159 80M159 64L162 61M143 80L140 83" stroke="${look.color}" stroke-width="3" stroke-linecap="round"/></g>`;
    if (id === 'hair-cloud') return `<path d="M65 77Q60 72 64 67Q66 62 72 64Q74 55 82 59Q87 60 87 66Q95 65 96 72Q96 78 89 79H70Q66 79 65 77Z" fill="${look.color}" stroke="#695078" stroke-width="1.5"/>`;
    if (id === 'hair-crown') return `<path d="M139 73L136 58L146 66L153 54L160 67L169 59L165 75Z" fill="${look.color}" stroke="#654321" stroke-width="1.5" stroke-linejoin="round"/><path d="M141 71H164" stroke="#fff0a6" stroke-width="2"/>`;
    return `<g fill="${look.color}"><path d="M70 66L72 71L78 72L73 76L74 82L70 78L65 82L66 76L61 72L67 71Z"/><path d="M152 83L154 87L159 88L155 91L156 96L152 93L148 96L149 91L145 88L150 87Z"/><circle cx="82" cy="58" r="2"/></g>`;
  }

  function renderAccessoryBack(id) {
    const look = looks[id];
    if (id === 'accessory-cape') return `<path d="M81 148Q110 136 139 148L154 188Q132 180 119 194L108 180Q94 182 68 194Z" fill="${look.color}" stroke="#342642" stroke-width="2" stroke-linejoin="round"/>`;
    if (id === 'accessory-backpack') return `<g><path d="M137 153Q150 151 153 163L155 186L138 189L132 169Z" fill="${look.color}" stroke="#342642" stroke-width="2"/><path d="M139 162H151V173H140Z" fill="#f3bc61"/></g>`;
    return '';
  }

  function renderAccessoryFront(id) {
    const look = looks[id];
    if (id === 'accessory-bandana') return `<path d="M83 143Q110 151 137 143L132 158L111 172L88 158Z" fill="${look.color}" stroke="#542537" stroke-width="1.5" stroke-linejoin="round"/>`;
    if (id === 'accessory-glasses') return `<g fill="none" stroke="${look.color}" stroke-width="3"><circle cx="91" cy="105" r="10"/><circle cx="130" cy="105" r="10"/><path d="M101 104Q110 99 120 104M80 102L73 99M141 102L148 99"/></g>`;
    if (id === 'accessory-bell') return `<g><path d="M88 145Q110 152 132 145" fill="none" stroke="#f4d379" stroke-width="3"/><circle cx="110" cy="157" r="7" fill="${look.color}" stroke="#805622" stroke-width="1.5"/><path d="M107 163H113" stroke="#805622" stroke-width="1.5"/></g>`;
    if (id === 'accessory-flower') return `<g><path d="M85 145Q110 154 135 145" fill="none" stroke="#f5d477" stroke-width="3"/><circle cx="110" cy="155" r="4" fill="#ffd43b"/><circle cx="110" cy="149" r="4" fill="${look.color}"/><circle cx="116" cy="155" r="4" fill="${look.color}"/><circle cx="110" cy="161" r="4" fill="${look.color}"/><circle cx="104" cy="155" r="4" fill="${look.color}"/></g>`;
    if (id === 'accessory-scarf') return `<g><path d="M82 143Q110 154 138 143L133 156Q110 166 87 156Z" fill="${look.color}" stroke="#342642" stroke-width="1.5"/><path d="M129 153L137 177L127 180L121 157Z" fill="${look.color}" stroke="#342642" stroke-width="1.5"/></g>`;
    if (id === 'accessory-wand') return `<g transform="rotate(28 153 130)"><path d="M153 131L153 168" stroke="${look.color}" stroke-width="4" stroke-linecap="round"/><path d="M153 119L156 126L164 127L158 132L160 140L153 136L146 140L148 132L142 127L150 126Z" fill="#ffd43b" stroke="#694894" stroke-width="1.5"/></g>`;
    return '';
  }

  function renderShoes(id) {
    const look = looks[id];
    if (!look) return '';
    const details = id === 'shoes-skates'
      ? `<circle cx="87" cy="197" r="2" fill="#ffd43b"/><circle cx="98" cy="197" r="2" fill="#ffd43b"/><circle cx="123" cy="197" r="2" fill="#ffd43b"/><circle cx="134" cy="197" r="2" fill="#ffd43b"/>`
      : `<path d="M83 190L98 190M122 190L137 190" stroke="#fff4e8" stroke-width="2" stroke-linecap="round"/>`;
    return `<g><path d="M77 185Q87 189 99 186L101 197Q93 202 79 198Q74 194 77 185ZM119 186Q131 189 143 185L146 196Q139 202 124 198Q118 194 119 186Z" fill="${look.color}" stroke="#342642" stroke-width="1.8"/>${details}</g>`;
  }

  function render(equipped, joy) {
    const outfit = equipped && typeof equipped === 'object' ? equipped : {};
    const expression = Number(joy) < 25 ? 'sad' : Number(joy) > 85 ? 'excited' : 'happy';
    const face = expression === 'excited'
      ? `<path d="M79 105Q86 96 94 105M125 105Q132 96 139 105" fill="none" stroke="#241b2a" stroke-width="5" stroke-linecap="round"/><path d="M103 109Q110 105 117 109Q116 122 110 123Q104 122 103 109Z" fill="#35202f"/><path d="M105 117Q110 114 115 117Q112 124 110 124Q107 123 105 117Z" fill="#f07794"/>`
      : expression === 'sad'
        ? `<ellipse cx="88" cy="104" rx="5" ry="7" fill="#241b2a"/><ellipse cx="132" cy="104" rx="5" ry="7" fill="#241b2a"/><path d="M102 120Q110 111 118 120" fill="none" stroke="#35202f" stroke-width="3" stroke-linecap="round"/>`
        : `<ellipse cx="88" cy="104" rx="5" ry="8" fill="#241b2a"/><ellipse cx="132" cy="104" rx="5" ry="8" fill="#241b2a"/><path d="M102 109Q110 106 118 109Q117 121 110 122Q103 121 102 109Z" fill="#35202f"/><path d="M105 117Q110 114 115 117Q112 123 110 123Q107 122 105 117Z" fill="#f07794"/>`;

    return `<svg class="pet-avatar" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 220" role="img" aria-label="Ruem wearing the currently equipped outfit">
      <defs><linearGradient id="fur" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff5ed"/><stop offset="1" stop-color="#f2d8d0"/></linearGradient><filter id="soft-shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="6" stdDeviation="5" flood-color="#170d28" flood-opacity=".28"/></filter></defs>
      <ellipse cx="110" cy="204" rx="57" ry="9" fill="#241742" opacity=".2"/>
      <g filter="url(#soft-shadow)">
        ${renderAccessoryBack(outfit.accessories)}
        <path d="M77 145Q80 136 97 135L107 145L114 135Q132 136 144 146Q155 161 151 190Q147 203 110 204Q73 203 69 190Q65 163 77 145Z" fill="#292132" stroke="#21182b" stroke-width="2"/>
        <ellipse cx="88" cy="194" rx="14" ry="7" fill="#f1d8d0"/><ellipse cx="132" cy="194" rx="14" ry="7" fill="#f1d8d0"/>
        ${renderPants(outfit.pants)}
        ${renderShirt(outfit.shirts || 'shirt-classic')}
        ${renderShoes(outfit.shoes)}
        <path d="M66 71Q50 66 41 82Q25 103 35 128Q43 145 61 151L77 137L77 90ZM154 71Q171 65 180 82Q196 104 186 129Q179 145 160 151L145 137L144 90Z" fill="#211a29" stroke="#19131f" stroke-width="3" stroke-linejoin="round"/>
        <path d="M36 124Q41 140 57 146L65 137L55 132Q44 131 36 124ZM185 124Q180 140 164 146L156 137L166 132Q177 131 185 124Z" fill="#bd354f"/>
        <ellipse cx="110" cy="102" rx="57" ry="55" fill="url(#fur)" stroke="#d7bcb8" stroke-width="2"/>
        <path d="M54 91Q49 50 82 40Q110 27 139 43Q171 59 165 94Q152 75 140 73Q128 94 110 87Q91 95 78 74Q64 79 54 91Z" fill="#241c2a" stroke="#19131f" stroke-width="2"/>
        <path d="M102 42Q101 29 111 21Q123 12 128 23Q132 31 123 36Q117 39 118 46" fill="none" stroke="#241c2a" stroke-width="11" stroke-linecap="round"/>
        <ellipse cx="72" cy="119" rx="10" ry="5" fill="#f1a1a8" opacity=".54"/><ellipse cx="148" cy="119" rx="10" ry="5" fill="#f1a1a8" opacity=".54"/>
        ${face}
        <path d="M145 70L152 56L158 67L170 66L162 75L164 87L153 81L143 87L145 75L136 68Z" fill="#ffd43b" stroke="#75522c" stroke-width="2" stroke-linejoin="round"/>
        ${renderHair(outfit.hair)}
        ${renderAccessoryFront(outfit.accessories)}
      </g>
    </svg>`;
  }

  global.RuemPetModel = { render };
})(window);
