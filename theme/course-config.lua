-- The opening/ending backgrounds are fixed template assets; course.yml only supplies course identity and school logo.
local fixedCoverBackground = 'assets/lntu-illustrated-background-4x3.png'
local fixedCoverOpacity = '0.45'
local fixedEndingBackground = 'assets/lntu-ending-artwork-4x3.png'
local fixedEndingAlt = '感谢聆听，欢迎讨论。浅青绿色校园插画。'

local function escape(text)
  return text:gsub('&','&amp;'):gsub('"','&quot;'):gsub('<','&lt;'):gsub('>','&gt;')
end

-- Markdown authoring entry point for the existing TOC markup and styles.
local function markdownToc(div)
  if not div.classes:includes('course-toc') then return nil end
  if div.identifier ~= '' or #div.classes ~= 1 then return nil end
  for key in pairs(div.attributes) do
    if key ~= 'current' then return nil end
  end
  if #div.content ~= 1 or div.content[1].t ~= 'BulletList' then return nil end

  local items = div.content[1].content
  if #items == 0 then return nil end
  local current = tonumber(div.attributes.current)
  if div.attributes.current and
      (not current or current % 1 ~= 0 or current < 1 or current > #items) then
    return nil
  end

  local links = {}
  for _, item in ipairs(items) do
    if #item ~= 1 or (item[1].t ~= 'Plain' and item[1].t ~= 'Para') then return nil end
    local content = item[1].content
    if #content ~= 1 or content[1].t ~= 'Link' then return nil end
    local link = content[1]
    if not link.target:match('^#/[^%s]+$') then return nil end
    if link.identifier ~= '' or #link.classes ~= 0 then return nil end
    for _ in pairs(link.attributes) do return nil end
    links[#links + 1] = link
  end

  local html = {'<nav class="course-toc" aria-label="内容目录">'}
  for index, link in ipairs(links) do
    local selected = index == current
    local class = selected and 'toc-entry is-chapter-current' or 'toc-entry'
    local aria = selected and ' aria-current="step"' or ''
    html[#html + 1] = '<a class="' .. class .. '" href="' .. escape(link.target) .. '"' .. aria .. '>'
      .. '<span class="toc-number">' .. string.format('%02d', index) .. '</span>'
      .. '<span class="toc-copy"><span class="toc-title">'
      .. escape(pandoc.utils.stringify(link.content)) .. '</span>'
      .. '<span class="toc-detail">' .. escape(link.title or '') .. '</span></span>'
      .. '<span class="toc-arrow" aria-hidden="true">→</span></a>'
  end
  html[#html + 1] = '</nav>'
  return pandoc.RawBlock('html', table.concat(html, '\n'))
end

function Pandoc(doc)
  local config = doc.meta.course or {}
  local function value(key, fallback)
    if config[key] == nil then return fallback end
    return pandoc.utils.stringify(config[key])
  end
  doc = doc:walk({
    Div = markdownToc,
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
  local tag = '<div id="course-template-config" hidden data-teacher="' .. escape(value('teacher','请填写姓名')) .. '"></div>'
  -- Hidden DOM configuration is independent of the included runtime scripts.
  doc.blocks:insert(pandoc.RawBlock('html', tag))
  return doc
end
