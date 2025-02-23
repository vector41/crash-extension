let latestHash = '';

const canvas = document.getElementById('arrayCanvas');
const ctx = canvas.getContext('2d');

const cellSize = 12;
const padding = 2;
const cols = 10000;
const rows = 6;

const cellWidth = cellSize + padding;
const cellHeight = cellSize + padding;

const gridWidth = cols * cellWidth;
const gridHeight = rows * cellHeight;

function drawGrid() {
    ctx.strokeStyle = '#444';

    for (let col = 0; col <= cols; col++) {
        const x = canvas.width - gridWidth + col * cellWidth;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, gridHeight);
        ctx.stroke();
    }

    for (let row = 0; row <= rows; row++) {
        const y = row * cellHeight;
        ctx.beginPath();
        ctx.moveTo(canvas.width - gridWidth, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

drawGrid();
$('#selected_status_modal').css('display', 'none');
showNotification('BC.GAME Analyzer was started. First please reload the BC.GAME website.');

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.latestHash) {
        const newValue = changes.latestHash.newValue;

        document.getElementById('game_hash_input').value = newValue;
        document.getElementById('game_verify_submit').click();
    }
});

chrome.storage.local.get(['latestHash'], (result) => {
    const storedValue = result.latestHash || 'No value stored yet';
    document.getElementById('game_hash_input').value = storedValue;
    document.getElementById('game_verify_submit').click();
});

let latestComboCount = 0;

const saltString = '0000000000000000000301e2801a9a9598bfb114e574a91a887f2132f33047e6';

window.addEventListener('message', (event) => {
    if (event.data?.hash) {
        $('#game_hash_input').val(event.data?.hash);

        const gameAmount = Number($('#game_amount_input').val());
        verify(event.data?.hash, gameAmount);
    }
});

$('.tabs ul li a').click(function () {
    const $this = $(this),
        $tabs = $this.closest('.tabs'),
        $li = $this.closest('li'),
        $lis = $tabs.find('ul > li');

    const id = $tabs.attr('id'),
        index = $lis.index($li);

    $lis.removeClass('is-active');
    $li.addClass('is-active');

    $(`#${id}-content > div`).addClass('is-hidden');
    $(`#${id}-content > div:eq(${index})`).removeClass('is-hidden');
});

function enterLoadState() {
    $('#game_hash_input').parent().addClass('is-loading');
    $('#game_verify_submit, #chart_plus_1_submit, #chart_plus_10_submit, #chart_plus_100_submit').addClass('is-loading');
    $('#game_hash_input, #game_amount_input, #game_verify_submit').attr('disabled', 'disabled');
}

function exitLoadState() {
    $('#game_hash_input').parent().removeClass('is-loading');
    $('#game_verify_submit, #chart_plus_1_submit, #chart_plus_10_submit, #chart_plus_100_submit').removeClass('is-loading');
    $('#game_hash_input, #game_amount_input, #game_verify_submit').removeAttr('disabled');
}

let $range = $('.range-analysis');

let isVerifying = false;
let data = [];
let data300 = [];
let data500 = [];
let data2000 = [];
let dataAnalysisRange = [];
let dataDot = [];
let combo12xCount = 0;
let combo15xCount = 0;
let combo2xCount = 0;
let combo3xCount = 0;
let gameRedThresold = Number($('#game_payout').val());
let duration = 0;

$('#game_verify_submit').on('click', () => {
    const gameHash = $('#game_hash_input').val();
    const gameAmount = Number($('#game_amount_input').val());
    const gameAmountRange1 = Number($('#game_range1_amount').val());
    const gameAmountRange2 = Number($('#game_range2_amount').val());
    verify(gameHash, gameAmount);
    verifyRange1(gameHash, gameAmountRange1);
    verifyRange2(gameHash, gameAmountRange2);
    verifyRangeLong(gameHash, 2000);
});

function verify(gameHash, gameAmount) {
    if (isVerifying) return;
    isVerifying = true;
    enterLoadState();
    $range.empty();
    duration = 0;

    data = [];
    let index = 0;
    for (let item of gameResults(gameHash, gameAmount)) {
        setTimeout(addTableRow.bind(null, item.hash, item.bust, data.length), data.length * 1);
        data.unshift({ ...item, index: ++index });
        duration += Math.log(item.bust || 1) / 0.00006;
    }

    // [1000, 100, 10, 9, 8, 5, 3, 2, 1.5].forEach((v) => showRangeAnalysis(data, v));
    analysisGameRange();

    drawChartMain();
    showBustList();
    showDotChart();

    analysisDashboard();
    analysisRangeMain();
    analysisAlarmPanel();
    predictNextPayout();
}

function analysisRangeMain() {
    let avgDelta = Number($('#game_amount_input').val()) / data.filter((v) => v.bust >= 10).length;
    let delta = 0, maxDelta = 0;
    let lastIndex = 0;

    data.filter((v) => v.bust >= 10).forEach(v => {
        if (lastIndex > 0) {
            delta = v.index - lastIndex;
            if (delta > maxDelta) {
                maxDelta = delta;
            }
        }
        lastIndex = v.index;
    });

    $('#game_main_analysis').text(`avg: ${avgDelta.toFixed(2)}, max: ${maxDelta}, total: ${data.filter((v) => v.bust >= 10).length}`);
}

function analysisRange1() {
    let avgDelta = Number($('#game_range1_amount').val()) / data300.filter((v) => v.bust >= 10).length;
    let delta = 0, maxDelta = 0;
    let lastIndex = 0;

    data300.filter((v) => v.bust >= 10).reverse().forEach(v => {
        if (lastIndex > 0) {
            delta = v.index - lastIndex;
            if (delta > maxDelta) {
                maxDelta = delta;
            }
        }
        lastIndex = v.index;
    });

    $('#game_range1_analysis').text(`avg: ${avgDelta.toFixed(2)}, max: ${maxDelta}, total: ${data300.filter((v) => v.bust >= 10).length}`);
}

function analysisRange2() {
    let avgDelta = Number($('#game_range2_amount').val()) / data500.filter((v) => v.bust >= 10).length;
    let delta = 0, maxDelta = 0;
    let lastIndex = 0;

    data500.filter((v) => v.bust >= 10).reverse().forEach(v => {
        if (lastIndex > 0) {
            delta = v.index - lastIndex;
            if (delta > maxDelta) {
                maxDelta = delta;
            }
        }
        lastIndex = v.index;
    });

    $('#game_range2_analysis').text(`avg: ${avgDelta.toFixed(2)}, max: ${maxDelta}, total: ${data500.filter((v) => v.bust >= 10).length}`);
}

function analysisDashboard() {
    const latest10x = data.reverse().filter((v) => v.bust >= 10)[0];
    $('#game_current_combo').text(latest10x.index - 1);

    const $divAverage = $('#game_average');
    $divAverage.empty();

    const count100 = data2000.filter((v) => v.index <= 100 && v.bust >= 10).length;
    const count200 = data2000.filter((v) => v.index <= 200 && v.bust >= 10).length;
    const count300 = data2000.filter((v) => v.index <= 300 && v.bust >= 10).length;
    const count500 = data2000.filter((v) => v.index <= 500 && v.bust >= 10).length;
    const count1000 = data2000.filter((v) => v.index <= 1000 && v.bust >= 10).length;
    const count2000 = data2000.filter((v) => v.index <= 2000 && v.bust >= 10).length;

    let shortAvg = (count300 - count100) / 3 + count100 / 3;
    let midAvg = ((count1000 - count300) / 7) * 2 / 3 + (count300 / 3) / 3;
    let longAvg = ((count2000 - count500) / 15) * 2 / 3 + (count500 / 5) / 3;

    let $rangeBadge1 = $('<div>').attr('class', `dashboard-status ${verifyAlarmStatus(shortAvg)}`);
    let $avgShort = $('<div>').attr('class', 'dashboard-item').text(`${shortAvg > 0 ? shortAvg.toFixed(1) : 0}`);
    $avgShort.append($rangeBadge1);

    let $rangeBadge2 = $('<div>').attr('class', `dashboard-status ${verifyAlarmStatus(midAvg)}`);
    let $avgMiddle = $('<div>').attr('class', 'dashboard-item').text(`${midAvg > 0 ? midAvg.toFixed(1) : 0}`);
    $avgMiddle.append($rangeBadge2);

    let $rangeBadge3 = $('<div>').attr('class', `dashboard-status ${verifyAlarmStatus(longAvg)}`);
    let $avgLong = $('<div>').attr('class', 'dashboard-item').text(`${longAvg > 0 ? longAvg.toFixed(1) : 0}`);
    $avgLong.append($rangeBadge3);

    [$avgShort, $avgMiddle, $avgLong].forEach((v) => $divAverage.append(v));
}

function analysisAlarmPanel() {
    let $panel = $('#alarm_container');
    $panel.empty();

    let number1 = data2000.filter((v) => v.index <= 500 && v.index > 400).filter((v) => v.bust >= 10).length;
    let $item500 = $('<div>').attr('class', 'alarm-item');
    let $number500 = $('<span>').attr('class', 'alarm-number').text(number1);
    let $status500 = $('<div>').attr('class', `alarm-status ${verifyAlarmStatus(number1)}`);
    $item500.append($number500).append($status500);

    let number2 = data2000.filter((v) => v.index <= 400 && v.index > 300).filter((v) => v.bust >= 10).length;
    let $item400 = $('<div>').attr('class', 'alarm-item');
    let $number400 = $('<span>').attr('class', 'alarm-number').text(number2);
    let $status400 = $('<div>').attr('class', `alarm-status ${verifyAlarmStatus(number2)}`);
    $item400.append($number400).append($status400);

    let number3 = data2000.filter((v) => v.index <= 300 && v.index > 200).filter((v) => v.bust >= 10).length;
    let $item300 = $('<div>').attr('class', 'alarm-item');
    let $number300 = $('<span>').attr('class', 'alarm-number').text(number3);
    let $status300 = $('<div>').attr('class', `alarm-status ${verifyAlarmStatus(number3)}`);
    $item300.append($number300).append($status300);

    let number4 = data2000.filter((v) => v.index <= 200 && v.index > 100).filter((v) => v.bust >= 10).length;
    let $item200 = $('<div>').attr('class', 'alarm-item');
    let $number200 = $('<span>').attr('class', 'alarm-number').text(number4);
    let $status200 = $('<div>').attr('class', `alarm-status ${verifyAlarmStatus(number4)}`);
    $item200.append($number200).append($status200);

    let number5 = data2000.filter((v) => v.index <= 100).filter((v) => v.bust >= 10).length;
    let $item100 = $('<div>').attr('class', 'alarm-item');
    let $number100 = $('<span>').attr('class', 'alarm-number').text(number5);
    let $status100 = $('<div>').attr('class', `alarm-status ${verifyAlarmStatus(number5)}`);
    $item100.append($number100).append($status100);

    [$item100, $item200, $item300, $item400, $item500].forEach(v => $panel.append(v));
}

function verifyAlarmStatus(param) {
    if (param <= 4)
        return 'golden';
    else if (param > 4 && param < 9)
        return 'normal';
    else
        return 'bad';
}

function verifyRange1(gameHash, gameAmount) {
    data300 = [];
    let index = 0;

    for (let item of gameResults(gameHash, gameAmount)) {
        setTimeout(addTableRow.bind(null, item.hash, item.bust, data300.length), data300.length * 1);
        data300.unshift({ ...item, index: ++index });
        duration += Math.log(item.bust || 1) / 0.00006;
    }
    drawChartRange1();
    analysisRange1();
}

function verifyRange2(gameHash, gameAmount) {
    data500 = [];
    let index = 0;

    for (let item of gameResults(gameHash, gameAmount)) {
        setTimeout(addTableRow.bind(null, item.hash, item.bust, data500.length), data500.length * 1);
        data500.unshift({ ...item, index: ++index });
        duration += Math.log(item.bust || 1) / 0.00006;
    }
    drawChartRange2();
    analysisRange2();
}

function verifyRangeLong(gameHash, gameAmount) {
    data2000 = [];
    let index = 0;

    for (let item of gameResults(gameHash, gameAmount)) {
        setTimeout(addTableRow.bind(null, item.hash, item.bust, data2000.length), data2000.length * 1);
        data2000.unshift({ ...item, index: ++index });
        duration += Math.log(item.bust || 1) / 0.00006;
    }
    controlComboStatus();
}

function analysisAverageRange(gameHash, range) {
    dataAnalysisRange = [];
    let perRange = range / 10;
    let index = 0;

    for (let item of gameResults(gameHash, range)) {
        setTimeout(addTableRow.bind(null, item.hash, item.bust, data2000.length), data2000.length * 1);
        dataAnalysisRange.unshift({ ...item, index: ++index });
        duration += Math.log(item.bust || 1) / 0.00006;
    }
    printLongAverage(range, perRange);
}

function printLongAverage(m, p) {
    let totalSum = 0;
    let content = ''
    for (let i = 0; i <= m; i = i + p) {
        if (i + p <= m) {
            totalSum += dataAnalysisRange.filter((v) => v.index > i && v.index <= i + p).reduce((sum, item) => sum + item.bust, 0);
            console.log(`${i} ~ ${i + p} range: ${(dataAnalysisRange.filter((v) => v.index > i && v.index <= i + p).reduce((sum, item) => sum + item.bust, 0)).toFixed(2)}`)
            content += `${i} ~ ${i + p} range: ${(dataAnalysisRange.filter((v) => v.index > i && v.index <= i + p).reduce((sum, item) => sum + item.bust, 0)).toFixed(2)} \n`;
        }
    }
    console.log(`avg in ${m} range: ${(totalSum / 10).toFixed(2)}`)
    content += `\n avg in ${m} range: ${(totalSum / 10).toFixed(2)}`;

    alert(content)
}

function showRangeAnalysis(data, bust) {
    let aboveItems = data.filter((v) => v.bust >= bust);
    let mainRange = Number($('#game_amount_input').val()) > 200 ? 100 : Number($('#game_amount_input').val());

    let delta = 0,
        totalDelta = 0,
        avgDelta = 0,
        maxDelta = 0,
        avgMainDelta = 0,
        maxMainDelta = 0,
        avgMain2Delta = 0,
        maxMain2Delta = 0,
        avgMain3Delta = 0,
        maxMain3Delta = 0,
        avg500Delta = 0,
        max500Delta = 0,
        avg1000Delta = 0,
        max1000Delta = 0,
        avg2000Delta = 0,
        max2000Delta = 0;

    let lastIndex = 0;
    let $div = $('<div>').css('margin-bottom', 10);
    aboveItems.reverse().forEach((item, i) => {
        if (lastIndex > 0) {
            delta = item.index - lastIndex;
            if (delta > maxDelta) maxDelta = delta;
            totalDelta += delta;
        }
        lastIndex = item.index;
    });

    avgDelta = avgDelta = Number($('#game_amount_input').val()) / aboveItems.filter((v) => v.bust >= bust).length;

    avgMainDelta = mainRange / data2000.filter((v) => v.index <= mainRange && v.bust >= bust).length;
    lastIndex = 0;
    data2000.filter((v) => v.index <= mainRange && v.bust >= bust).reverse().forEach(v => {
        if (lastIndex > 0) {
            delta = v.index - lastIndex;
            if (delta > maxMainDelta) maxMainDelta = delta;
        }
        lastIndex = v.index;
    });

    avgMain2Delta = mainRange * 2 / data2000.filter((v) => v.index <= mainRange * 2 && v.bust >= bust).length;
    lastIndex = 0;
    data2000.filter((v) => v.index <= mainRange * 2 && v.bust >= bust).reverse().forEach(v => {
        if (lastIndex > 0) {
            delta = v.index - lastIndex;
            if (delta > maxMain2Delta) maxMain2Delta = delta;
        }
        lastIndex = v.index;
    });

    avgMain3Delta = mainRange * 3 / data2000.filter((v) => v.index <= mainRange * 3 && v.bust >= bust).length;
    lastIndex = 0;
    data2000.filter((v) => v.index <= mainRange * 3 && v.bust >= bust).reverse().forEach(v => {
        if (lastIndex > 0) {
            delta = v.index - lastIndex;
            if (delta > maxMain3Delta) maxMain3Delta = delta;
        }
        lastIndex = v.index;
    });

    avg500Delta = 500 / data2000.filter((v) => v.index <= 500 && v.bust >= bust).length;
    lastIndex = 0;
    data2000.filter((v) => v.index <= 500 && v.bust >= bust).reverse().forEach(v => {
        if (lastIndex > 0) {
            delta = v.index - lastIndex;
            if (delta > max500Delta) max500Delta = delta;
        }
        lastIndex = v.index;
    });

    avg1000Delta = 1000 / data2000.filter((v) => v.index <= 1000 && v.bust >= bust).length;
    lastIndex = 0;
    data2000.filter((v) => v.index <= 1000 && v.bust >= bust).reverse().forEach(v => {
        if (lastIndex > 0) {
            delta = v.index - lastIndex;
            if (delta > max1000Delta) max1000Delta = delta;
        }
        lastIndex = v.index;
    });

    avg2000Delta = 2000 / data2000.filter((v) => v.index <= 2000 && v.bust >= bust).length;
    lastIndex = 0;
    data2000.filter((v) => v.index <= 2000 && v.bust >= bust).reverse().forEach(v => {
        if (lastIndex > 0) {
            delta = v.index - lastIndex;
            if (delta > max2000Delta) max2000Delta = delta;
        }
        lastIndex = v.index;
    });

    let $label = $('<label>').text(`Above x${bust} (${parseFloat((99 / bust).toFixed(2))}%) : ${aboveItems.length}`).css('font-size', '16px').css('font-weight', '500').css('color', 'rgb(224 224 224)').css('display', 'block');
    let $label1 = $('<label>').text(`${mainRange} - a: ${avgMainDelta.toFixed(2)}, m: ${maxMainDelta}, t: ${data2000.filter((v) => v.index <= 100 && v.bust >= bust).length}`).css('font-size', '12px').css('color', '#fff').css('display', 'block');
    let $label2 = $('<label>').text(`${mainRange * 2} - a: ${avgMain2Delta.toFixed(2)}, m: ${maxMain2Delta}, t: ${(data2000.filter((v) => v.index <= 200 && v.bust >= bust).length / 2).toFixed(1)}`).css('font-size', '12px').css('color', '#fff').css('display', 'block');
    let $label3 = $('<label>').text(`${mainRange * 3} - a: ${avgMain3Delta.toFixed(2)}, m: ${maxMain3Delta}, t: ${(data2000.filter((v) => v.index <= 300 && v.bust >= bust).length / 3).toFixed(1)}`).css('font-size', '12px').css('color', '#fff').css('display', 'block');
    let $label4 = $('<label>').text(`500 - a: ${avg500Delta.toFixed(2)}, m: ${max500Delta}, t: ${(data2000.filter((v) => v.index <= 500 && v.bust >= bust).length / 5).toFixed(1)}`).css('font-size', '12px').css('color', '#fff').css('display', 'block');
    let $label5 = $('<label>').text(`1000 - a: ${avg1000Delta.toFixed(2)}, m: ${max1000Delta}, t: ${(data2000.filter((v) => v.index <= 1000 && v.bust >= bust).length / 10).toFixed(1)}`).css('font-size', '12px').css('color', '#fff').css('display', 'block');
    let $label6 = $('<label>').text(`2000 - a: ${avg2000Delta.toFixed(2)}, m: ${max2000Delta}, t: ${(data2000.filter((v) => v.index <= 2000 && v.bust >= bust).length / 20).toFixed(1)}`).css('font-size', '12px').css('color', '#fff').css('display', 'block');
    let $labelL = $('<label>').text(`avg: ${avgDelta.toFixed(2)}, max: ${maxDelta}`).css('font-weight', '500').css('font-size', '14px').css('color', 'rgb(255 128 0)').css('display', 'block').css('margin-bottom', '4px');

    [$label, $labelL, $label1, $label2, $label3, $label4, $label5, $label6].forEach((v) => $div.append(v).css('display', 'block'));
    $range.append($div);
}

function subString(text, limitLength) {
    if (text.length > limitLength)
        return text.substring(0, limitLength) + '...';
    else
        return text;
}

function predictNextPayout() {
    const MC = 10, KDJ = 5;
    const gameHash = $('#game_hash_input').val();
    let rows = 51;
    let matrix = Array.from({ length: rows }, (_, index) => [index, 0, 0]);

    duration = 0;
    dataPrediction = [];
    let calcLength = Math.floor((rows - 1) / 10) * MC * KDJ;

    for (let item of gameResults(gameHash, calcLength)) {
        setTimeout(addTableRow.bind(null, item.hash, item.bust, dataPrediction.length), dataPrediction.length * 1);
        dataPrediction.push(item.bust);
        duration += Math.log(item.bust || 1) / 0.00006;
    }

    for (let i = 0; i < dataPrediction.length; i++) {
        for (let j = 11; j < rows; j++) {
            let calcLen = (j / 10) * MC * KDJ;

            if (i <= calcLen) {
                if (dataPrediction[i] >= j / 10)
                    matrix[j][1]++;

                let avgStep = matrix[j][1] > 0 ? i / matrix[j][1] : 0;

                let maxCombos = (j / 10) * MC;
                let curStep = maxCombos * KDJ;

                let mainModel = avgStep / curStep;
                matrix[j][2] = Math.max(matrix[j][2], mainModel.toFixed(2));
            }
        }
    }

    let sortedMatrix = matrix.slice(11, 51).sort((a, b) => b[2] - a[2]);

    let content = sortedMatrix[0][0] / 10;
    for (let i = 1; i < 10; i++)
        content += `, ${sortedMatrix[i][0] / 10}`;

    $('#prediction_container').text(content);
}

function showDotChart() {
    const gameHash = $('#game_hash_input').val();
    let $dotchart = $('#game_dot_chart');
    let dotGroupCount = 0;
    $dotchart.empty();

    duration = 0;

    let dataDot = [];
    let index = 0;
    for (let item of gameResults(gameHash, 300)) {
        setTimeout(addTableRow.bind(null, item.hash, item.bust, dataDot.length), dataDot.length * 1);
        dataDot.unshift({ ...item, index: ++index });
        duration += Math.log(item.bust || 1) / 0.00006;
    }

    dataDot.forEach((v, i) => {
        let $item = $('<div>').attr('class', 'dot-item').attr('title', `${v.bust} (${v.index})`);
        $item.click((e) => {
            showBustStatusModal(e.pageX, e.pageY, v.bust, v.index);
        });
        let $dot = $('<div>').attr('class', `dot ${guessBustLevel(v.bust)}`);

        if (i === 0) {
            dotGroupCount = 0;
            let $group = $('<div>').attr('class', 'dot-group').attr('id', `dot_group${dotGroupCount}`);

            $item.append($dot);
            $group.append($item);
            $dotchart.append($group);
        } else {
            if (compareBustPrevious(v.bust, dataDot[i - 1].bust)) {
                let $group = $(`#dot_group${dotGroupCount}`);
                if ($group.children().length >= 6)
                    $item.append($dot).css('position', 'absolute').css('bottom', 0).css('right', `${($group.children().length - 6) * 14}px`);
                else
                    $item.append($dot);

                $group.append($item);
                $dotchart.append($group);
            } else {
                let $group = $('<div>').attr('class', 'dot-group').attr('id', `dot_group${dotGroupCount + 1}`);
                dotGroupCount++;

                $item.append($dot);
                $group.append($item);
                $dotchart.append($group);
            }
        }
    });
}

function showBustList() {
    let $bustlist = $('.bust-list');
    $bustlist.empty();

    data.forEach((v, i) => {
        let $bust = $('<div>').attr('class', `bust-item ${guessBustLevel(v.bust)}`).text(v.bust).attr('title', `${v.bust} (${v.index})`);;
        $bust.click((e) => {
            showBustStatusModal(e.pageX, e.pageY, v.bust, v.index);
        });
        $bustlist.append($bust);
    });
}

function showBustStatusModal(x, y, bust, index) {
    let $modal = $('#selected_status_modal');
    let $modalBust = $('#seleted_bust');
    let $modalIndex = $('#seleted_index');

    $modal.css('top', `${y + 10}px`).css('left', `${$(window).width() - x > 100 ? x + 10 : x - 40}px`).css('display', 'block');
    $modalBust.text(`Bust: ${bust}`);
    $modalIndex.text(`Index: ${index}`);

    setTimeout(() => {
        $modal.css('display', 'none');
    }, 2000);
}

function showDangerModal() {
    let $modal = $('#danger_modal');
    $modal.css('display', 'block');

    setTimeout(() => {
        $modal.css('display', 'none');
    }, 3000);
}

function controlComboStatus() {
    const range100count = data2000.filter((v) => v.index <= 100 && v.bust >= 10).length;
    const range200count = data2000.filter((v) => v.index <= 200 && v.bust >= 10).length;
    const range300count = data2000.filter((v) => v.index <= 300 && v.bust >= 10).length;
    const range400count = data2000.filter((v) => v.index <= 400 && v.bust >= 10).length;
    const range500count = data2000.filter((v) => v.index <= 500 && v.bust >= 10).length;
    const range1000count = data2000.filter((v) => v.index <= 1000 && v.bust >= 10).length;
    const range2000count = data2000.filter((v) => v.index <= 2000 && v.bust >= 10).length;

    customBadgeClass('bad');
    $('#alert_content').text('Wait chance!');

    let message;
    let status = false;

    let prediction = '';
    let predictionAmount = 0;

    let busts = [];
    data2000.filter((v) => v.index <= 50).reverse().map((v) => busts.push(v.bust));
    let latestBust = busts[0];

    if (latestBust < 3) {
        combo3xCount++;

        if (latestBust < 1.2)
            combo12xCount++;
        if (latestBust >= 1.2 && latestBust < 1.5)
            combo15xCount++;
        if (latestBust >= 1.5 && latestBust < 2)
            combo2xCount++;
    } else {
        combo12xCount = 0;
        combo15xCount = 0;
        combo2xCount = 0;
        combo3xCount = 0;
    }

    if (predictionAmount > 0) {
        message = `Next prediction: ${prediction}`;
        status = true;
        $('#alert_content').text(message);
    }
    if ((500 / range500count >= 12) && (1000 / range1000count >= 12) && (2000 / range2000count >= 12)) {
        message = `You should pay attention! (Average). ${predictionAmount > 0 ? 'Prediction: ' + prediction : ''}`;
        status = true;
        customBadgeClass('normal');
        $('#alert_content').text(message);
    }
    if ((500 / range500count + 1000 / range1000count + 2000 / range2000count >= 12) / 3 >= 12) {
        message = `You should pay attention! (Average). ${predictionAmount > 0 ? 'Prediction: ' + prediction : ''}`;
        status = true;
        customBadgeClass('normal');
        $('#alert_content').text(message);
    }
    if (data2000.filter((v) => v.index < 26 && v.bust >= 10).length <= 0) {
        message = `Pay attention! No 10X in over 25 times. ${predictionAmount > 0 ? 'Prediction: ' + prediction : ''}`;
        status = true;
        customBadgeClass('normal');
        $('#alert_content').text(message);
    }
    if (data2000.filter((v) => v.index < 31 && v.bust >= 10).length <= 0) {
        message = `Pay attention! No 10X in over 30 times. ${predictionAmount > 0 ? 'Prediction: ' + prediction : ''}`;
        status = true;
        customBadgeClass('normal');
        $('#alert_content').text(message);
    }
    if (data2000.filter((v) => v.index < 36 && v.bust >= 10).length <= 0) {
        message = `Pay attention! No 10X in over 35 times. ${predictionAmount > 0 ? 'Prediction: ' + prediction : ''}`;
        status = true;
        customBadgeClass('normal');
        $('#alert_content').text(message);
    }
    if (data2000.filter((v) => v.index < 41 && v.bust >= 10).length <= 0) {
        message = `Pay attention! No 10X in over 40 times. ${predictionAmount > 0 ? 'Prediction: ' + prediction : ''}`;
        status = true;
        customBadgeClass('golden');
        $('#alert_content').text(message);
    }
    if (analysisRangeState(range500count, range1000count, range2000count)) {
        message = `Pay attention! Combo. ${predictionAmount > 0 ? 'Prediction: ' + prediction : ''}`;
        status = true;
        customBadgeClass('golden');
        $('#alert_content').text(message);
    }
    if ((data2000.filter((v) => v.index < 81 && v.bust >= 10).length <= 3) && data2000.filter((v) => v.index < 80 && v.bust !== 10).length >= 70) {
        message = `Pay attention! Not good 10X in over 70 times. ${predictionAmount > 0 ? 'Prediction: ' + prediction : ''}`;
        status = true;
        customBadgeClass('golden');
        $('#alert_content').text(message);
    }
    if (range100count <= 4) {
        message = `Pay attention! 10X only ${range100count} times in 100 rounds. ${predictionAmount > 0 ? 'Prediction: ' + prediction : ''}`;
        status = true;
        customBadgeClass('golden');
        $('#alert_content').text(message);
    }
    if (range200count >= 8 && range200count <= 10) {
        message = `Pay attention! 10X only ${range200count} times in 200 rounds. ${predictionAmount > 0 ? 'Prediction: ' + prediction : ''}`;
        status = true;
        customBadgeClass('golden');
        $('#alert_content').text(message);
    }
    if (range300count >= 12 && range300count <= 15) {
        message = `Pay attention! 10X only ${range300count} times in 300 rounds. ${predictionAmount > 0 ? 'Prediction: ' + prediction : ''}`;
        status = true;
        customBadgeClass('golden');
        $('#alert_content').text(message);
    }
    if (range400count >= 16 && range400count <= 20) {
        message = `Pay attention! 10X only ${range400count} times in 400 rounds. ${predictionAmount > 0 ? 'Prediction: ' + prediction : ''}`;
        status = true;
        customBadgeClass('golden');
        $('#alert_content').text(message);
    }
    if (range400count >= 16 && range400count <= 20) {
        message = `Pay attention! 10X only ${range400count} times in 400 rounds. ${predictionAmount > 0 ? 'Prediction: ' + prediction : ''}`;
        status = true;
        customBadgeClass('golden');
        $('#alert_content').text(message);
    }

    if (status === true) {
        showNotification(message);
    }
}

function verifyPredictionStatus(param) {
    if (param > 3)
        return 'mega';
    else if (param >= 2 && param < 3)
        return 'golden';
    else if (param >= 1.5 && param < 2)
        return 'normal';
    else
        return 'bad';
}

function showNotification(value) {
    const notification = new Notification('BC.GAME', {
        body: value,
        icon: 'favicon.png',
        requireInteraction: false,
    });

    notification.onclick = () => {
        chrome.tabs.create({ url: chrome.runtime.getURL('popup.html') });
    };
}

function analysisRangeState(param1, param2, param3) {
    let step500 = 500 / param1;
    let step1000 = 1000 / param2;
    let step2000 = 2000 / param3;

    let avg500 = 100 / step500 / 2 - 1;
    let avg1000 = 100 / step1000 / 2 - 1;
    let avg2000 = 100 / step2000 / 2 - 1;

    let allowedStep = 100 / avg500;

    if (step500 > allowedStep)
        return true;
    else if (step2000 > allowedStep && step1000 > allowedStep && step500 < allowedStep)
        return true;
    else
        return false;
}

function analysisGameRange() {
    let rangeString = $('#game_analysis_range').val();
    let rangeArray = [];
    rangeString.split(',').forEach(r => {
        rangeArray.push(Number(r.trim()));
    });

    $range.empty();
    rangeArray.reverse().forEach((v) => showRangeAnalysis(data, v));
}

function customBadgeClass(param) {
    $('#alert_container').removeClass('bad');
    $('#alert_container').removeClass('normal');
    $('#alert_container').removeClass('golden');

    $('#alert_container').addClass(`${param}`);
}

function guessBustLevel(param) {
    if (param < gameRedThresold)
        return 'bad';
    else if (param >= 10)
        return 'good';
    else
        return 'middle';
}

function compareBustPrevious(param1, param2) {
    if (param1 < gameRedThresold && param2 < gameRedThresold)
        return true;
    if (param1 >= gameRedThresold && param2 >= gameRedThresold)
        return true;
    return false;
}

$('#chart_stable_100').on('click', () => {
    $('#game_amount_input').val(100);
    $('#game_verify_submit').click();
});

$('#chart_stable_300').on('click', () => {
    $('#game_amount_input').val(300);
    $('#game_verify_submit').click();
});

$('#chart_stable_500').on('click', () => {
    $('#game_amount_input').val(500);
    $('#game_verify_submit').click();
});

$('#chart_stable_1000').on('click', () => {
    $('#game_amount_input').val(1000);
    $('#game_verify_submit').click();
});

$('#chart_stable_2000').on('click', () => {
    $('#game_amount_input').val(2000);
    $('#game_verify_submit').click();
});

$('#game_payout').on('keyup', (e) => {
    if (e.keyCode === 13) {
        gameRedThresold = Number($('#game_payout').val());

        drawChartMain();
        showDotChart();
        showBustList();
    }
});

$('#game_amount_input').on('keyup', () => {
    if ($('#game_amount_input').val() >= 10000) {
        showDangerModal();
    }
});

$('#game_range1_amount').on('keyup', (e) => {
    if (e.keyCode === 13) {
        const gameHash = $('#game_hash_input').val();
        const gameAmount = Number($('#game_range1_amount').val());
        verifyRange1(gameHash, gameAmount);
    }
});

$('#game_range2_amount').on('keyup', (e) => {
    if (e.keyCode === 13) {
        const gameHash = $('#game_hash_input').val();
        const gameAmount = Number($('#game_range2_amount').val());
        verifyRange2(gameHash, gameAmount);
    }
});

$('#game_analysis_submit').on('click', () => {
    analysisGameRange();
});

$('#payout_analysis_submit').on('click', () => {
    const gameHash = $('#game_hash_input').val();
    const gameAmount = Number($('#game_analysis_payout').val());
    analysisAverageRange(gameHash, gameAmount);
});

const addTableRow = (hash, bust, index) => {
    $('<tr/>')
        .attr({
            class: index === 0 ? 'is-first' : null,
        })
        .append($('<td/>').text(hash))
        .append(
            $('<td/>')
                .text(bust)
                .attr({
                    class: bust >= gameRedThresold ? 'is-over-median' : 'is-under-median',
                })
        )
        .appendToWithIndex($('#game_verify_table'), index);

    if (index >= $('#game_amount_input').val() - 1) {
        exitLoadState();
        isVerifying = false;
    }
};

$.fn.appendToWithIndex = function (to, index) {
    if (!(to instanceof jQuery)) {
        to = $(to);
    }
    if (index === 0) {
        $(this).prependTo(to);
    } else {
        $(this).insertAfter(to.children().eq(index - 1));
    }
};

function prob(multiplier) {
    if (Array.isArray(multiplier)) {
        return multiplier.reduce((accumulator, item) => {
            return accumulator * prob(item);
        }, 1);
    } else if (!isNaN(multiplier)) {
        return 0.99 / multiplier;
    } else {
        throw new Error(`multiplier must be a number or array instead of '${typeof multiplier}'.`);
    }
}

prob.invert = function (probability) {
    if (Array.isArray(probability)) {
        let result = [];
        if (probability.length > 0) result[0] = prob.invert(probability[0]);
        for (let i = 1; i < probability.length; i++) {
            result.push(prob.invert(probability[i] / probability[i - 1]));
            if (result[result.length - 1] < 1.01) {
                throw new Error(`probability[${i}] is impossible.`);
            }
        }
        return result;
    } else if (!isNaN(probability)) {
        return 0.99 / probability;
    } else {
        throw new Error(`probability must be a number or array instead of '${typeof probability}'.`);
    }
};

function* gameResults(gameHash, gameAmount) {
    let salt = saltString;
    let prevHash = null;
    for (let index = 0; index < gameAmount; index++) {
        let hash = String(prevHash ? CryptoJS.SHA256(String(prevHash)) : gameHash);
        let bust = salt.startsWith('0x') ? gameResultForEthercrash(hash, salt) : gameResult(hash, salt);
        yield { hash, bust };

        prevHash = hash;
    }
}

function divisible(hash, mod) {
    let val = 0;

    let o = hash.length % 4;
    for (let i = o > 0 ? o - 4 : 0; i < hash.length; i += 4) {
        val = ((val << 16) + parseInt(hash.substring(i, i + 4), 16)) % mod;
    }

    return val === 0;
}

function hmac(key, v) {
    let hmacHasher = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, key);
    return hmacHasher.finalize(v).toString();
}

function gameResultForEthercrash(serverSeed, salt) {
    let hash = hmac(serverSeed, salt);

    if (divisible(hash, 101)) return 0;

    let h = parseInt(hash.slice(0, 52 / 4), 16);
    let e = Math.pow(2, 52);

    return (Math.floor((100 * e - h) / (e - h)) / 100).toFixed(2);
}

function gameResult(seed, salt) {
    const nBits = 52;

    const hmac = CryptoJS.HmacSHA256(CryptoJS.enc.Hex.parse(seed), salt);
    seed = hmac.toString(CryptoJS.enc.Hex);

    seed = seed.slice(0, nBits / 4);
    const r = parseInt(seed, 16);

    let X = r / Math.pow(2, nBits);
    X = 99 / (1 - X);

    const result = Math.floor(X);
    return Math.max(1, result / 100);
}

let chartMain = null;
let chartRange300 = null;
let chartRange500 = null;

function drawChartMain() {
    const ctx = document.getElementById('chart_container_main');

    const chartData = {
        labels: data.map((d) => {
            let index = d.index;
            let count = data.filter((v) => v.index < index && v.bust >= 10).length;
            let combo = data.filter((v) => v.index < index && v.bust >= 10).map((d) => d.index).length > 0 ? index - data.filter((v) => v.index < index && v.bust >= 10).map((d) => d.index)[0] - 1 : data.filter((v) => v.index < index && v.bust !== 10).length;
            return `${index} , ${count} , ${combo}`;
        }),
        datasets: [
            {
                label: '',
                data: data.map((d) => d.bust),
                backgroundColor: (ctx) => {
                    if (ctx.raw < gameRedThresold) {
                        return '#e60606';
                    } else if (ctx.raw >= 10 && ctx.raw < 100) {
                        return '#c5c608';
                    } else if (ctx.raw >= 100) {
                        return '#2393e3';
                    }
                    return '#037a04';
                },
            },
        ],
    };

    const config = {
        type: 'bar',
        data: chartData,
        options: {
            animation: {
                duration: 0
            },
            responsive: true,
            scales: {
                x: {
                    grid: {
                        offset: false,
                    },
                    ticks: {
                        display: false,
                        autoSkip: data.length > 50 ? true : false,
                        font: {
                            size: 10,
                        },
                    },
                },
                y: {
                    beginAtZero: true,
                    max: 20,
                    ticks: {
                        callback: function (value, index, ticks) {
                            return value + ' x';
                        },
                        stepSize: 5,
                        font: {
                            size: 10,
                        },
                    },
                },
            },
            plugins: {
                legend: {
                    display: false,
                },
            },
        },
    };

    if (chartMain) {
        chartMain.destroy();
    }

    Chart.defaults.font.size = 12;
    chartMain = new Chart(ctx, config);
}

function drawChartRange1() {
    const ctx = document.getElementById('chart_container_300');

    const chartData = {
        labels: data300.map((d) => {
            let index = d.index;
            let count = data300.filter((v) => v.index < index && v.bust >= 10).length;
            let combo = data300.filter((v) => v.index < index && v.bust >= 10).map((d) => d.index).length > 0 ? index - data300.filter((v) => v.index < index && v.bust >= 10).map((d) => d.index)[0] - 1 : data300.filter((v) => v.index < index && v.bust !== 10).length;
            return `${index} , ${count} , ${combo}`;
        }),
        datasets: [
            {
                label: '',
                data: data300.map((d) => d.bust),
                backgroundColor: (ctx) => {
                    if (ctx.raw < 2) {
                        return '#e60606';
                    } else if (ctx.raw >= 10 && ctx.raw < 100) {
                        return '#c5c608';
                    } else if (ctx.raw >= 100) {
                        return '#2393e3';
                    }
                    return '#037a04';
                },
            },
        ],
    };

    const config = {
        type: 'bar',
        data: chartData,
        options: {
            animation: {
                duration: 0
            },
            responsive: true,
            scales: {
                x: {
                    grid: {
                        offset: false,
                    },
                    ticks: {
                        display: false,
                        autoSkip: data.length > 50 ? true : false,
                    },
                },
                y: {
                    beginAtZero: true,
                    max: 20,
                    ticks: {
                        callback: function (value, index, ticks) {
                            return value + ' x';
                        },
                        stepSize: 5,
                        font: {
                            size: 10,
                        },
                    },
                },
            },
            plugins: {
                legend: {
                    display: false,
                },
            },
        },
    };

    if (chartRange300) {
        chartRange300.destroy();
    }

    chartRange300 = new Chart(ctx, config);
}

function drawChartRange2() {
    const ctx = document.getElementById('chart_container_500');

    const chartData = {
        labels: data500.map((d) => {
            let index = d.index;
            let count = data500.filter((v) => v.index < index && v.bust >= 10).length;
            let combo = data500.filter((v) => v.index < index && v.bust >= 10).map((d) => d.index).length > 0 ? index - data500.filter((v) => v.index < index && v.bust >= 10).map((d) => d.index)[0] - 1 : data500.filter((v) => v.index < index && v.bust !== 10).length;
            return `${index} , ${count} , ${combo}`;
        }),
        datasets: [
            {
                label: '',
                data: data500.map((d) => d.bust),
                backgroundColor: (ctx) => {
                    if (ctx.raw < 2) {
                        return '#e60606';
                    } else if (ctx.raw >= 10 && ctx.raw < 100) {
                        return '#c5c608';
                    } else if (ctx.raw >= 100) {
                        return '#2393e3';
                    }
                    return '#037a04';
                },
            },
        ],
    };

    const configRange500 = {
        type: 'bar',
        data: chartData,
        options: {
            animation: {
                duration: 0
            },
            responsive: true,
            scales: {
                x: {
                    grid: {
                        offset: false,
                    },
                    ticks: {
                        autoSkip: data.length > 50 ? true : false,
                        display: false,
                    },
                },
                y: {
                    beginAtZero: true,
                    max: 20,
                    ticks: {
                        callback: function (value, index, ticks) {
                            return value + ' x';
                        },
                        stepSize: 5,
                        font: {
                            size: 10,
                        },
                    },
                },
            },
            plugins: {
                legend: {
                    display: false,
                },
            },
        },
    };

    if (chartRange500) {
        chartRange500.destroy();
    }

    chartRange500 = new Chart(ctx, configRange500);
}

$('#game_verify_submit').click();

function msToTime(duration) {
    let seconds = Math.floor((duration / 1000) % 60),
        minutes = Math.floor((duration / (1000 * 60)) % 60),
        hours = Math.floor((duration / (1000 * 60 * 60)) % 24),
        days = Math.floor(duration / (1000 * 60 * 60 * 24));

    hours = (hours < 10) ? '0' + hours : hours;
    minutes = (minutes < 10) ? '0' + minutes : minutes;
    seconds = (seconds < 10) ? '0' + seconds : seconds;

    return (days > 0 ? days + 'd ' : '') + hours + 'h ' + minutes + 'm ' + seconds + 's';
}
