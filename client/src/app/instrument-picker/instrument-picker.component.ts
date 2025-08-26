import { Component, forwardRef, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

interface InstrumentOption {
  name: string;
  value: string;
  image: string;
}

@Component({
  selector: 'app-instrument-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './instrument-picker.component.html',
  styleUrls: ['./instrument-picker.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InstrumentPickerComponent),
      multi: true,
    },
  ],
})
export class InstrumentPickerComponent implements ControlValueAccessor {
  instruments: InstrumentOption[] = [
    { name: 'Vocals', value: 'VOCALS', image: 'assets/singer-screen.png' },
    { name: 'violin', value: 'VIOLIN', image: 'assets/violin.jpg' },
    { name: 'Harpist', value: 'HARPIST', image: 'assets/harpist.jpg' },
    { name: 'Drums', value: 'DRUMS', image: 'assets/drums.jpg' },
    { name: 'Saxophone', value: 'SAX', image: 'assets/saxophone.jpg' },
    { name: 'piano', value: 'PIANO', image: 'assets/piano.jpg' },
    { name: 'Xylophone', value: 'XYLOPHONE', image: 'assets/xylophone.jpg' },
  ];

  selectedInstrument: WritableSignal<string | null> = signal(null);

  onChange: any = () => {};
  onTouch: any = () => {};

  writeValue(value: any): void {
    if (value) {
      this.selectedInstrument.set(value);
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouch = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
  }

  selectInstrument(instrument: InstrumentOption): void {
    this.selectedInstrument.set(instrument.value);
    this.onChange(instrument.value);
    this.onTouch();
  }

  onKeyDown(event: KeyboardEvent, instrument: InstrumentOption): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.selectInstrument(instrument);
    }
  }
}
