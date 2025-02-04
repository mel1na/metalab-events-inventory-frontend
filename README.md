# metalab-events-inventory-frontend


## Using POS, STORNO and number inputs:

pseudocode:
```
if input string is empty:
    if an item is selected:
        STORNO: deletes selected item
        POS: deselects item
    else:
        STORNO: deletes most recent item from order
        POS: does nothing (deselects item)
else:
    STORNO: clears input
    if input contains '.' (i.e. is a decimal number):
        POS: adds a generic entry to order (using input as price)
    else if an item is selected:
        POS: sets the amount of the selected item (using input as amount)
    else if the most recent item has an amount of 1:
        POS: sets the amount of the most recent item (using input as amount)
    else:
        POS: adds a generic entry to order (using input as price)
```

examples:<br>
(using [item] to denote an item input)

- [item], STORNO -> empty order
- [item], POS -> order containing item
- [item], 2, POS -> order containing item twice
- [item1], [item2], STORNO -> order containing only item1
- [item1], [item2], 2, POS -> order containing item1 once and item2 twice
- [item1], [item2], (select item1), STORNO -> order containing only item2
- [item1], [item2], (select item1), POS -> order containing item1 and item2 (with no item - selected)
- [item1], [item2], (select item1), 2, POS -> order containing item1 twice and item2 once
- 2.3, POS -> order containing a generic item priced 2.30€
- 2.3, POS, 2, POS -> order containing a generic item priced 2.30€ twice
- [item], 2.3, POS -> order containing item and a generic item priced 2.3€
- [item], 2, POS, 3, POS -> order containing item and a generic item priced 3.00€
