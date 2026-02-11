local ui = {}

ui.new = function(name)
  local gui = Instance.new("ScreenGui")
  gui.Name = name
  gui.Parent = game:GetService("CoreGui")
  return gui
end

return ui
