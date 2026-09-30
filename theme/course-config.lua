-- The opening/ending backgrounds are fixed template assets; course.yml only supplies course identity and school logo.
local fixedCoverBackground = 'assets/lntu-illustrated-background-4x3.png'
local fixedCoverOpacity = '0.45'
local fixedEndingBackground = 'assets/lntu-ending-artwork-4x3.png'
local fixedEndingAlt = '感谢聆听，欢迎讨论。浅青绿色校园插画。'

function Pandoc(doc)
  local config = doc.meta.course or {}
  local function value(key, fallback)
    if config[key] == nil then return fallback end
    return pandoc.utils.stringify(config[key])
  end
  doc = doc:walk({
    Header = function(header)
      if header.classes:includes('preview-cover') then
        local ending = header.classes:includes('ending-page')
        header.attributes['background-image'] = ending and fixedEndingBackground or fixedCoverBackground
        header.attributes['background-size'] = 'contain'
        header.attributes['background-position'] = 'center center'
        header.attributes['background-color'] = '#f7f6f0'
        header.attributes['background-opacity'] = ending and '1' or fixedCoverOpacity
        if ending then header.attributes['background-image-alt'] = fixedEndingAlt end
      end
      return header
    end,
    Image = function(img)
      if img.classes:includes('cover-school-image') then
        img.src = value('school-logo', 'assets/school-mark.svg')
      end
      return img
    end
  })
  -- Put configuration outside slide content; the runtime reads it for the footer.
  local function escape(text)
    return text:gsub('&','&amp;'):gsub('"','&quot;'):gsub('<','&lt;'):gsub('>','&gt;')
  end
  local tag = '<div id="course-template-config" hidden data-teacher="' .. escape(value('teacher','请填写姓名')) .. '"></div>'
  -- Hidden DOM configuration is independent of the included runtime scripts.
  doc.blocks:insert(pandoc.RawBlock('html', tag))
  return doc
end
