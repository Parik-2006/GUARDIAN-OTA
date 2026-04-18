#include "lcd.h"
#include "driver/gpio.h"
#include "esp_rom_sys.h" // for esp_rom_delay_us
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include <string.h>

#define LCD_RS GPIO_NUM_21
#define LCD_E  GPIO_NUM_22

#define LCD_D4 GPIO_NUM_18
#define LCD_D5 GPIO_NUM_19
#define LCD_D6 GPIO_NUM_23
#define LCD_D7 GPIO_NUM_5

static void lcd_delay_ms(uint32_t ms) {
    vTaskDelay(pdMS_TO_TICKS(ms) ? pdMS_TO_TICKS(ms) : 1);
}
static void lcd_delay_us(uint32_t us) {
    esp_rom_delay_us(us);
}

static void lcd_pulse_e(void) {
    gpio_set_level(LCD_E, 1);
    lcd_delay_us(5); // Minimum 230ns, using 5us for safety
    gpio_set_level(LCD_E, 0);
    lcd_delay_us(300); // Give controller time to process
}

static void lcd_write_nibble(uint8_t nibble) {
    gpio_set_level(LCD_D4, (nibble >> 0) & 0x01);
    gpio_set_level(LCD_D5, (nibble >> 1) & 0x01);
    gpio_set_level(LCD_D6, (nibble >> 2) & 0x01);
    gpio_set_level(LCD_D7, (nibble >> 3) & 0x01);
    lcd_pulse_e();
}

static void lcd_write_byte(uint8_t rs, uint8_t data) {
    gpio_set_level(LCD_RS, rs);
    lcd_write_nibble(data >> 4);   // High nibble
    lcd_write_nibble(data & 0x0F); // Low nibble
    lcd_delay_us(50); // Most commands take ~37us
}

void lcd_clear(void) {
    lcd_write_byte(0, 0x01);
    lcd_delay_ms(2); // Clear display takes ~1.5ms
}

void lcd_set_cursor(int row, int col) {
    uint8_t row_offsets[] = {0x00, 0x40, 0x14, 0x54};
    lcd_write_byte(0, 0x80 | (col + row_offsets[row]));
}

void lcd_init(void) {
    gpio_config_t io_conf = {
        .intr_type = GPIO_INTR_DISABLE,
        .mode = GPIO_MODE_OUTPUT,
        .pin_bit_mask = (1ULL<<LCD_RS)|(1ULL<<LCD_E)|(1ULL<<LCD_D4)|(1ULL<<LCD_D5)|(1ULL<<LCD_D6)|(1ULL<<LCD_D7),
        .pull_down_en = 0,
        .pull_up_en = 0
    };
    gpio_config(&io_conf);
    
    gpio_set_level(LCD_RS, 0);
    gpio_set_level(LCD_E, 0);

    // HD44780 Initialization Sequence (Wait for power up)
    lcd_delay_ms(50);
    
    // Set to 8-bit mode 3 times to ensure sync
    lcd_write_nibble(0x03);
    lcd_delay_ms(5);
    lcd_write_nibble(0x03);
    lcd_delay_us(150);
    lcd_write_nibble(0x03);
    lcd_delay_us(150);
    
    // Set to 4-bit mode
    lcd_write_nibble(0x02); 
    lcd_delay_us(150);

    // Function set (4-bit, 2 line, 5x8)
    lcd_write_byte(0, 0x28);
    // Display off
    lcd_write_byte(0, 0x08);
    // Clear display
    lcd_clear();
    // Entry mode set (Increment cursor)
    lcd_write_byte(0, 0x06);
    // Display on
    lcd_write_byte(0, 0x0C);
}

void lcd_print(const char* str) {
    while (*str) {
        lcd_write_byte(1, *str++);
    }
}
