import type { CSSProperties } from 'react';
import { SCHEME_NAMES } from '@/app/theme';
import { BOARD_PALETTES, boardThumbnail } from '@/components/board/boardThemes';
import { PIECE_SETS } from '@/components/board/pieceSets';
import { PieceSetPicker } from '@/components/board/PieceSetPicker';
import { San } from '@/chess/San';
import { Card, Segmented, Switch } from '@/components/ui';
import { hapticsSupported } from '@/lib/haptics';
import { useReducedMotion } from '@/lib/useReducedMotion';
import {
  type BoardTheme,
  type ColorScheme,
  type DragTarget,
  type MaterialDisplay,
  type MoveMethod,
  type Notation,
  useSettings,
} from '@/store/settings';
import { SoundThemePicker, VolumeSlider } from './SoundControls';

/** Settings → Appearance: the colour scheme and notation, sound and vibration, and the board. */
export function AppearanceSettings() {
  return (
    <div className="settings__grid">
      <div className="stack">
        <BoardCard />
      </div>
      <div className="stack">
        <DisplayCard />
        <SoundCard />
      </div>
    </div>
  );
}

function DisplayCard() {
  const settings = useSettings();
  return (
    <Card id="display">
      <h2 style={{ fontSize: '1.15rem' }}>Display</h2>
      <div className="settings__group">
        <div className="settings__row">
          <span>Colour scheme</span>
          <Segmented<ColorScheme>
            ariaLabel="Colour scheme"
            value={settings.colorScheme}
            onChange={(v) => settings.update({ colorScheme: v })}
            options={[
              { value: 'system', label: SCHEME_NAMES.system },
              { value: 'dark', label: SCHEME_NAMES.dark },
              { value: 'light', label: SCHEME_NAMES.light },
            ]}
          />
        </div>
        <p className="small muted" style={{ margin: 0 }}>
          Nightshift is dark, Dayshift is light. System follows your device.
        </p>
        <div className="settings__row">
          <span>Move notation</span>
          <Segmented<Notation>
            ariaLabel="Move notation"
            value={settings.notation}
            onChange={(v) => settings.update({ notation: v })}
            options={[
              { value: 'figurine', label: 'Figurines' },
              { value: 'letters', label: 'Letters' },
            ]}
          />
        </div>
        <p className="small muted" style={{ margin: 0 }} data-testid="notation-sample">
          1. e4 e5 2. <San san="Nf3" /> <San san="Nc6" /> 3. <San san="Bb5" /> a6 4.{' '}
          <San san="Bxc6" /> — moves everywhere are written this way; files, PGN and links always
          use letters.
        </p>
      </div>
    </Card>
  );
}

function SoundCard() {
  const settings = useSettings();
  return (
    <Card id="sound">
      <h2 style={{ fontSize: '1.15rem' }}>Sound & vibration</h2>
      <div className="settings__group">
        <Switch
          checked={settings.sounds}
          onChange={(v) => settings.update({ sounds: v })}
          label="Sound effects"
          description="Short synthesized sounds for moves, captures, checks and results."
        />
        {settings.sounds || (settings.haptics && hapticsSupported()) ? (
          <div className="settings__row">
            <span>
              Sound theme
              {!settings.sounds ? (
                <>
                  <br />
                  <span className="small muted">
                    Also picks the vibration patterns while sounds are off.
                  </span>
                </>
              ) : null}
            </span>
            <SoundThemePicker />
          </div>
        ) : null}
        {settings.sounds ? (
          <div className="settings__row">
            <VolumeSlider className="settings__slider" />
          </div>
        ) : null}
        <Switch
          checked={settings.haptics}
          onChange={(v) => settings.update({ haptics: v })}
          label="Vibration"
          description={
            hapticsSupported()
              ? 'A short buzz on moves, solves and mistakes, on devices with a vibration motor. Available in this browser.'
              : 'A short buzz on moves, solves and mistakes — not available in this browser.'
          }
        />
      </div>
    </Card>
  );
}

function BoardCard() {
  const settings = useSettings();
  const reducedMotion = useReducedMotion();
  const tapOnly = settings.moveMethod === 'tap';
  const palette = BOARD_PALETTES[settings.boardTheme];
  const pieces = PIECE_SETS[settings.pieceSet];
  return (
    <Card id="board" data-testid="board-settings">
      <h2 style={{ fontSize: '1.15rem' }}>Board</h2>
      <div className="settings__group">
        <div className="settings__row">
          <span>Board theme</span>
          <div className="swatches" role="group" aria-label="Board theme">
            {(Object.keys(BOARD_PALETTES) as BoardTheme[]).map((theme) => {
              const thumb = boardThumbnail(theme);
              return (
                <button
                  key={theme}
                  type="button"
                  className={thumb ? 'swatch swatch--texture' : 'swatch'}
                  aria-label={BOARD_PALETTES[theme].label}
                  aria-pressed={settings.boardTheme === theme}
                  title={BOARD_PALETTES[theme].hint ?? BOARD_PALETTES[theme].label}
                  style={
                    {
                      '--sw-light': BOARD_PALETTES[theme].light,
                      '--sw-dark': BOARD_PALETTES[theme].dark,
                      ...(thumb ? { '--sw-image': thumb } : {}),
                    } as CSSProperties
                  }
                  onClick={() => settings.update({ boardTheme: theme })}
                />
              );
            })}
          </div>
        </div>
        <p className="small muted" style={{ margin: 0 }}>
          {palette.label}
          {palette.hint ? ` — ${palette.hint}` : null}
          {palette.image ? (
            <>
              {' '}
              — from Lichess, by the lila authors and pirouetti (
              <a
                href={`${import.meta.env.BASE_URL}licence-agpl.txt`}
                target="_blank"
                rel="noreferrer"
              >
                AGPL-3.0
              </a>
              ). The picture downloads once, then works offline.
            </>
          ) : null}
        </p>
        <div className="settings__row settings__row--stack">
          <span>Pieces</span>
          <PieceSetPicker
            value={settings.pieceSet}
            onChange={(set) => settings.update({ pieceSet: set })}
          />
        </div>
        <p className="small muted" style={{ margin: 0 }}>
          {pieces.hint} By {pieces.author} (
          <a href={pieces.licenceUrl} target="_blank" rel="noreferrer">
            {pieces.licence}
          </a>
          ).
        </p>
        <Switch
          checked={settings.showCoordinates}
          onChange={(v) => settings.update({ showCoordinates: v })}
          label="Show coordinates"
        />
        <Switch
          checked={settings.showLegalMoves}
          onChange={(v) => settings.update({ showLegalMoves: v })}
          label="Show legal move dots"
        />
        <Switch
          checked={settings.boardHighlights}
          onChange={(v) => settings.update({ boardHighlights: v })}
          label="Highlight the last move and check"
        />
        <Switch
          checked={settings.animations}
          onChange={(v) => settings.update({ animations: v })}
          label="Animate pieces"
          description={
            reducedMotion
              ? 'Your device asks for less motion, so pieces move without animation whatever this says.'
              : undefined
          }
        />
        <div className="settings__row">
          <span>Move pieces by</span>
          <Segmented<MoveMethod>
            ariaLabel="Move pieces by"
            value={settings.moveMethod}
            onChange={(v) => settings.update({ moveMethod: v })}
            options={[
              { value: 'either', label: 'Tap or drag' },
              { value: 'tap', label: 'Tap' },
              { value: 'drag', label: 'Drag' },
            ]}
          />
        </div>
        <fieldset
          className="settings__fieldset"
          disabled={tapOnly}
          aria-describedby={tapOnly ? 'drag-settings-hint' : undefined}
          data-testid="drag-settings"
        >
          <legend className="sr-only">Dragging</legend>
          <Switch
            checked={settings.magnifyDrag}
            onChange={(v) => settings.update({ magnifyDrag: v })}
            label="Magnify the dragged piece"
            description="The piece grows under your finger so you can see it while dragging."
          />
          <div className="settings__row">
            <span>Drag target</span>
            <Segmented<DragTarget>
              ariaLabel="Drag target"
              value={settings.dragTarget}
              onChange={(v) => settings.update({ dragTarget: v })}
              options={[
                { value: 'circle', label: 'Circle' },
                { value: 'square', label: 'Square' },
                { value: 'none', label: 'None' },
              ]}
            />
          </div>
        </fieldset>
        {tapOnly ? (
          <p className="small muted" id="drag-settings-hint" style={{ margin: 0 }}>
            These two apply to dragging only; choose “Tap or drag” or “Drag” above to use them.
          </p>
        ) : null}
        <div className="settings__row">
          <span>Captured material</span>
          <Segmented<MaterialDisplay>
            ariaLabel="Captured material"
            value={settings.materialDisplay}
            onChange={(v) => settings.update({ materialDisplay: v })}
            options={[
              { value: 'difference', label: 'Difference' },
              { value: 'count', label: 'Every capture' },
              { value: 'off', label: 'Off' },
            ]}
          />
        </div>
        <p className="small muted" style={{ margin: 0 }}>
          {settings.materialDisplay === 'difference'
            ? 'Beside the player bars: only the pieces one side is up, with the balance in pawns.'
            : settings.materialDisplay === 'count'
              ? 'Beside the player bars: every piece each side has captured.'
              : 'Nothing beside the player bars.'}
        </p>
      </div>
    </Card>
  );
}
