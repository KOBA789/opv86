const isREXPrefix = (v) => {
    return (v & 0xf0) == 0x40;
};
class OpV86 {
    isMatchedWithFilter(op, filter) {
        if (filter.length == 0)
            return true;
        if (op.opcode.replace(/ /g, '').toLowerCase().indexOf(filter) != -1)
            return true;
        if (op.instr.replace(/ /g, '').toLowerCase().indexOf(filter) != -1)
            return true;
        return false;
    }
    updateOpByteDetails(filter) {
        const opbinElement = $('#opbin');
        opbinElement.empty();
        if (!filter.match(/^[\d\sa-fA-F]+$/))
            return;
        const hexList = filter.replace(/\s+/g, '').match(/.{1,2}/g);
        let phase = 1 /* EXPECT_PREFIX_AND_LATTER */;
        for (const hex of hexList) {
            const v = parseInt(hex, 16);
            const e = $('<div>').text(hex);
            e.addClass('opv86-opcode-byte');
            opbinElement.append(e);
            if (phase == 1 /* EXPECT_PREFIX_AND_LATTER */) {
                phase = 2 /* EXPECT_REX_OR_LATTER */;
            }
            if (phase == 2 /* EXPECT_REX_OR_LATTER */) {
                if (isREXPrefix(v)) {
                    e.addClass('opv86-opcode-prefix');
                    phase = 3 /* EXPECT_OPCODE_OR_LATTER */;
                    continue;
                }
                phase = 3 /* EXPECT_OPCODE_OR_LATTER */;
            }
            e.addClass('opv86-opcode-op');
        }
    }
    updateFilter(filter) {
        filter = filter.trim().toLowerCase().replace(/\s+/g, '');
        for (const index in this.data.ops) {
            const op = this.data.ops[index];
            if (!this.isMatchedWithFilter(op, filter)) {
                $(`.opv86-op-${index}`).css('display', 'none');
                continue;
            }
            $(`.opv86-op-${index}`).css('display', '');
        }
        // this.updateOpByteDetails(filter);
    }
    updateTable(data) {
        this.data = data;
        const oplist = $('#oplist');
        oplist.empty();
        oplist.append($('<div>').addClass('opv86-oplist-header').text('Opcode'));
        oplist.append($('<div>').addClass('opv86-oplist-header').text('Instr'));
        oplist.append($('<div>').addClass('opv86-oplist-header').text('Encoding'));
        oplist.append($('<div>').addClass('opv86-oplist-header').text('Page in SDM(phys)'));
        oplist.append($('<div>')
            .addClass('opv86-oplist-header-description')
            .text('Description'));
        const opRowList = [];
        for (const index in data.ops) {
            const op = data.ops[index];
            const opcodeByteElements = [];
            const opcodeBytes = op.opcode.replace(/REX\.W \+/g, 'REX.W')
                .replace(/REX \+/g, 'REX')
                .replace(/ \+ /g, '+')
                .replace(/\+ /g, '+')
                .replace(/ \+/g, '+')
                .trim()
                .split(' ');
            const opcodeByteAttrs = [];
            let phase = 1 /* EXPECT_PREFIX_AND_LATTER */;
            const prefixes = [
                // Group 1
                'F0',
                'F2',
                'F3',
                'F2',
                // Group 2
                '2E',
                '36',
                '3E',
                '26',
                '64',
                '65',
                '2E',
                '3E',
                // Group 3
                '66',
                // Group 4
                '67',
            ];
            for (const k in opcodeBytes) {
                const opByte = opcodeBytes[k];
                if (phase <= 1 /* EXPECT_PREFIX_AND_LATTER */) {
                    if (opByte === 'NP' || prefixes.includes(opByte)) {
                        opcodeByteAttrs.push({ classAttr: 'opv86-opcode-prefix', opSize: 1 });
                        phase = 2 /* EXPECT_REX_OR_LATTER */;
                        continue;
                    }
                }
                if (phase <= 2 /* EXPECT_REX_OR_LATTER */) {
                    if (opByte.indexOf('REX') != -1) {
                        opcodeByteAttrs.push({ classAttr: 'opv86-opcode-prefix', opSize: 1 });
                        phase = 3 /* EXPECT_OPCODE_OR_LATTER */;
                        continue;
                    }
                }
                if (phase <= 3 /* EXPECT_OPCODE_OR_LATTER */) {
                    if (opByte.match(/^[\da-fA-F]{2}/)) {
                        opcodeByteAttrs.push({ classAttr: 'opv86-opcode-op', opSize: 1 });
                        phase = 3 /* EXPECT_OPCODE_OR_LATTER */;
                        continue;
                    }
                }
                if (phase <= 4 /* EXPECT_MOD_RM_OR_LATTER */) {
                    if (opByte.match(/^\//)) {
                        opcodeByteAttrs.push({ classAttr: 'opv86-opcode-modrm', opSize: 1 });
                        phase = 5 /* EXPECT_SIB_OR_LATTER */;
                        continue;
                    }
                }
                if (phase <= 7 /* EXPECT_IMM */) {
                    if (opByte.indexOf('ib') != -1 || opByte.indexOf('cb') != -1) {
                        opcodeByteAttrs.push({ classAttr: 'opv86-opcode-imm', opSize: 1 });
                        phase = 8 /* EXPECT_NONE */;
                        continue;
                    }
                    if (opByte.indexOf('iw') != -1 || opByte.indexOf('cw') != -1) {
                        opcodeByteAttrs.push({ classAttr: 'opv86-opcode-imm', opSize: 2 });
                        phase = 8 /* EXPECT_NONE */;
                        continue;
                    }
                    if (opByte.indexOf('id') != -1 || opByte.indexOf('cd') != -1) {
                        opcodeByteAttrs.push({ classAttr: 'opv86-opcode-imm', opSize: 4 });
                        phase = 8 /* EXPECT_NONE */;
                        continue;
                    }
                    if (opByte.indexOf('cp') != -1) {
                        opcodeByteAttrs.push({ classAttr: 'opv86-opcode-imm', opSize: 6 });
                        phase = 8 /* EXPECT_NONE */;
                        continue;
                    }
                    if (opByte.indexOf('io') != -1) {
                        opcodeByteAttrs.push({ classAttr: 'opv86-opcode-imm', opSize: 8 });
                        phase = 8 /* EXPECT_NONE */;
                        continue;
                    }
                }
                opcodeByteAttrs.push({ classAttr: 'opv86-opcode-unknown', opSize: 1 });
            }
            const sizeAttrTable = {
                1: 'opv86-opcode-byte',
                2: 'opv86-opcode-word',
                4: 'opv86-opcode-dword',
                6: 'opv86-opcode-p16ofs32',
                8: 'opv86-opcode-qword',
            };
            for (const k in opcodeBytes) {
                const opByte = opcodeBytes[k];
                const opAttr = opcodeByteAttrs[k];
                const e = $('<div>').text(opByte).addClass(`opv86-op-${index}`);
                e.addClass(opAttr.classAttr);
                e.addClass(sizeAttrTable[opAttr.opSize]);
                opcodeByteElements.push(e);
            }
            /*
            for (const opByte of opcodeBytes) {
              const e = $('<div>').text(opByte).addClass(`opv86-op-${index}`);
              if (opByte.indexOf('REX') != -1) {
                e.addClass('opv86-opcode-byte opv86-opcode-prefix');
              } else if (opByte.startsWith('NP')) {
                e.addClass('opv86-opcode-byte opv86-opcode-prefix');
              } else if (opByte.indexOf('/') != -1) {
                e.addClass('opv86-opcode-byte opv86-opcode-modrm');
              } else if (opByte.indexOf('ib') != -1 || opByte.indexOf('cb') != -1) {
                e.addClass('opv86-opcode-byte opv86-opcode-imm');
              } else if (opByte.indexOf('iw') != -1 || opByte.indexOf('cw') != -1) {
                e.addClass('opv86-opcode-word opv86-opcode-imm');
              } else if (opByte.indexOf('id') != -1 || opByte.indexOf('cd') != -1) {
                e.addClass('opv86-opcode-dword opv86-opcode-imm');
              } else if (opByte.indexOf('io') != -1) {
                e.addClass('opv86-opcode-qword opv86-opcode-imm');
              } else {
                e.addClass('opv86-opcode-byte opv86-opcode-op');
              }
              opcodeByteElements.push(e);
            }
            */
            oplist.append($('<div>')
                .addClass(`opv86-op-${index}`)
                .addClass('opv86-oplist-item-opcode')
                .append(opcodeByteElements));
            oplist.append($('<div>')
                .addClass(`opv86-op-${index}`)
                .addClass('opv86-oplist-item-instr')
                .text(op.instr));
            oplist.append($('<div>')
                .addClass(`opv86-op-${index}`)
                .addClass('opv86-oplist-item-encoding')
                .text(op.op_en));
            oplist.append($('<div>')
                .addClass(`opv86-op-${index}`)
                .addClass('opv86-oplist-item-page')
                .append($(`<a target="_blank" href='https://software.intel.com/content/dam/develop/public/us/en/documents/325383-sdm-vol-2abcd.pdf#page=${op.page}'>p.${op.page}</a>`)));
            oplist.append($('<div>')
                .addClass(`opv86-op-${index}`)
                .addClass('opv86-oplist-item-description')
                .text(op.description));
        }
    }
}
(() => {
    $.getJSON(`data/ops.json`, function (data) {
        return;
        const opv86 = new OpV86();
        $('#data-info')
            .text(`Parsed at: ${data.date_parsed}, based on: ${data.source_file} (${data.document_id}), ${data.document_version}`);
        document.getElementById('filter-value').addEventListener('keyup', () => {
            opv86.updateFilter(document.getElementById('filter-value').value);
        });
        opv86.updateTable(data);
        // opv86.updateFilter('48 c7 c0 01 00 00 00');
    });
})();
function appendOpListHeaders(oplist) {
    oplist.empty();
    const oplistRow = $('<div>').addClass('opv86-oplist-container');
    oplistRow.append($('<div>').addClass('opv86-oplist-header').text('Opcode'));
    oplistRow.append($('<div>').addClass('opv86-oplist-header').text('Instr'));
    oplistRow.append($('<div>')
        .addClass('opv86-oplist-header-description')
        .text('Description'));
    oplist.append(oplistRow);
}
function appendOpListElement(oplist, op, index) {
    const oplistRow = $('<div>')
        .addClass('opv86-oplist-container')
        .addClass(`opv86-oplist-row-${index}`);
    oplistRow.click(() => {
        console.log(`clicked! ${index}`);
        $('.opv86-description-panel').remove();
        const opDescription = $('<div>')
            .addClass('opv86-description-panel');
        opDescription.append($('<h3>').text(op.instr));
        opDescription.append($('<p>').text(op.description));
        if (op.op_en) {
            opDescription.append($('<h4>').text('Encoding'));
            opDescription.append($('<p>').text(op.op_en));
        }
        opDescription.insertAfter(oplistRow);
        if (op.page !== undefined) {
            opDescription.append($(`<a target="_blank" href='https://software.intel.com/content/dam/develop/public/us/en/documents/325383-sdm-vol-2abcd.pdf#page=${op.page}'>From p.${op.page} of Intel SDM</a>`));
        }
    });
    const sizeAttrTable = {
        1: 'opv86-opcode-byte',
        2: 'opv86-opcode-word',
        4: 'opv86-opcode-dword',
        6: 'opv86-opcode-p16ofs32',
        8: 'opv86-opcode-qword',
    };
    const opcodeByteElements = op.opcode_bytes.map(b => {
        const e = $('<div>');
        e.addClass(`opv86-op-${index}`);
        e.text(b.components.join(' '));
        if (sizeAttrTable[b.byte_size_min]) {
            e.addClass(sizeAttrTable[b.byte_size_min]);
        }
        else {
            e.addClass(sizeAttrTable[1]);
        }
        if (b.byte_type) {
            e.addClass(`opv86-opcode-byte-${b.byte_type}`);
        }
        return e;
    });
    oplistRow.append($('<div>')
        .addClass(`opv86-op-${index}`)
        .addClass('opv86-oplist-item-opcode')
        .append(opcodeByteElements));
    oplistRow.append($('<div>')
        .addClass(`opv86-op-${index}`)
        .addClass('opv86-oplist-item-instr')
        .text(op.instr_parsed.join(' ')));
    oplistRow.append($('<div>')
        .addClass(`opv86-op-${index}`)
        .addClass('opv86-oplist-item-description')
        .text(op.description));
    oplist.append(oplistRow);
}
function isMatchedWithFilter(op, filter) {
    if (filter.length == 0)
        return true;
    if (op.opcode.replace(/ /g, '').toLowerCase().indexOf(filter) != -1)
        return true;
    if (op.instr.replace(/ /g, '').toLowerCase().indexOf(filter) != -1)
        return true;
    return false;
}
function updateFilter(data, filter) {
    $('.opv86-description-panel').remove();
    filter = filter.trim().toLowerCase().replace(/\s+/g, '');
    for (const index in data) {
        const op = data[index];
        if (!isMatchedWithFilter(op, filter)) {
            $(`.opv86-oplist-row-${index}`).css('display', 'none');
            continue;
        }
        $(`.opv86-oplist-row-${index}`).css('display', '');
    }
}
(() => {
    const opListContainerDiv = $('#oplist2');
    $.getJSON(`data/instr_list.json`, function (data) {
        appendOpListHeaders(opListContainerDiv);
        console.log(data[0]);
        for (let i = 0; i < data.length; i++) {
            appendOpListElement(opListContainerDiv, data[i], i);
        }
        document.getElementById('filter-value').addEventListener('keyup', () => {
            updateFilter(data, document.getElementById('filter-value').value);
        });
    });
})();
var SDMInstrOpByteType;
(function (SDMInstrOpByteType) {
    SDMInstrOpByteType["Opcode"] = "opcode";
    SDMInstrOpByteType["Imm"] = "imm";
})(SDMInstrOpByteType || (SDMInstrOpByteType = {}));
