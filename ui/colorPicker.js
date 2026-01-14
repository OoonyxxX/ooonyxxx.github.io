// Параметры colorPicker
const PICKER_CONFIG = {
    width: 200,
    layout: [
        { component: iro.ui.Wheel }
    ]
};

export const PICKER_ITEM = {
    pickerEl: null,
	colorIn: null,
};

/**
 * Создает и привязывает ColorPicker к указанному элементу
 * @param {HTMLElement} container - DOM контейнер для ColorPicker (form)
 * @param {string|object} initialColor - Начальный цвет
 * @returns {Object} - Экземпляр iro.ColorPicker (чтобы потом можно было удалить)
 */
export function attachColorPicker(container, initialColor) {
    PICKER_ITEM.pickerEl = container.querySelector('.color-picker');
	PICKER_ITEM.colorIn = container.querySelector('.color-input');

    // Создаем конфиг, объединяя стандартный с переданным цветом
    const config = {
        ...PICKER_CONFIG,
        color: initialColor || '#ffffff'
    };


    const colorPicker = new iro.ColorPicker(PICKER_ITEM.pickerEl, config);

    // Подписываемся на события
    colorPicker.on('color:change', (color) => {
		const { r, g, b } = color.rgb;
		PICKER_ITEM.colorIn.value = `${r},${g},${b}`;
    });

    return colorPicker;
}