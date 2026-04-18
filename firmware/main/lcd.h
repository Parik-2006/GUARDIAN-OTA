#ifndef LCD_H
#define LCD_H

void lcd_init(void);
void lcd_clear(void);
void lcd_print(const char* str);
void lcd_set_cursor(int row, int col);

#endif
