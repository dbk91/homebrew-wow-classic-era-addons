cask "restedxp" do
  version "4.6.70"
  sha256 "7b063d146f4fceeeab31985d6c5ec1f8eb1540e6f6d855834c9914b52d82f523"

  url "https://github.com/RestedXP/RXPGuides/releases/download/v#{version}/RXPGuides-v#{version}-classic.zip"
  name "RestedXP"
  desc "RestedXP: WoW Classic leveling guides addon"
  homepage "https://github.com/RestedXP/RXPGuides"

  addon_dir = File.expand_path("/Applications/World of Warcraft/_classic_era_/Interface/AddOns")

  preflight do
    FileUtils.mkdir_p addon_dir unless Dir.exist?(addon_dir)
  end

  artifact "RXPGuides", target: "#{addon_dir}/RXPGuides"

  zap trash: [
    "#{addon_dir}/RXPGuides"
  ]
end
