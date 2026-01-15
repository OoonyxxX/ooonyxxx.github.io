import { dynamicPaintSingleMarker } from "../features/markers.js"
// Параметры colorPicker
const PICKER_CONFIG = {
    width: 200,
    layout: [
        { component: iro.ui.Wheel }
    ]
};

const PICKER_ITEM = {
    pickerEl: null,
	colorIn: null,
};

/**
 * Создает и привязывает ColorPicker к указанному элементу
 * @param {HTMLElement} container - DOM контейнер для ColorPicker (form)
 * @param {object} marker - маркер контейнера
 * @returns {Object} - Экземпляр iro.ColorPicker (чтобы потом можно было удалить)
 */
export function attachColorPicker(container, marker) {
    PICKER_ITEM.pickerEl = container.querySelector('.color-picker');
	PICKER_ITEM.colorIn = container.querySelector('.color-input');

    // Создаем конфиг, объединяя стандартный с переданным цветом
    const config = {
        ...PICKER_CONFIG,
        //color: marker.options.custom_csscolor || '#fff',
        color: 'rgb(173, 16, 16)'
    };


    const colorPicker = new iro.ColorPicker(PICKER_ITEM.pickerEl, config);

    console.log("colorPicker inited:", PICKER_ITEM.colorIn);

    // Подписываемся на события
    colorPicker.on('color:change', (color) => {
		const { r, g, b } = color.rgb;
		PICKER_ITEM.colorIn.value = `${r},${g},${b}`;
        console.log("Color changed:", PICKER_ITEM.colorIn.value);
        dynamicPaintSingleMarker(marker, PICKER_ITEM.colorIn.value);
    });

    return colorPicker;
}